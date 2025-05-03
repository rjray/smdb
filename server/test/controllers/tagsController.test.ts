/**
 * Test suite for the controller functions in the `controllers/tagsController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";
import { TagData } from "@smdb-types/tags";

import { Tag, Reference } from "../../src/models";
import { Tags } from "../../src/db";
import * as tagsController from "../../src/controllers/tagsController";

// Mock the Tags database module
vi.mock("../../src/db", () => ({
  Tags: {
    createTag: vi.fn(),
    getAllTags: vi.fn(),
    getTagById: vi.fn(),
    updateTagById: vi.fn(),
    deleteTagById: vi.fn(),
  },
}));

// Helper to create a mock tag
const createMockTag = (
  id: number,
  name: string,
  options: {
    type?: string;
    referenceCount?: number;
    references?: Partial<Reference>[];
  } = {}
): Tag => {
  const { type = "meta", referenceCount, references } = options;
  const now = new Date();

  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    referenceCount,
    references,
    clean: () => {
      const result: TagData = {
        id,
        name,
        type,
        description: null,
        referenceCount,
      };
      if (references) {
        const referencelist = [];
        for (const reference of references) {
          if (reference.clean && typeof reference.clean === "function")
            referencelist.push(reference.clean());
        }

        result.references = referencelist;
      }

      return result;
    },
  } as Tag;
};

// Helper to create a mock Exegesis context
const createMockContext = (
  options: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    requestBody?: unknown;
  } = {}
): ExegesisContext => {
  const { path = {}, query = {}, requestBody = {} } = options;

  return {
    params: {
      path,
      query,
    },
    requestBody,
    res: {
      status: vi.fn().mockReturnThis(),
      pureJson: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    },
  } as unknown as ExegesisContext;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("tagsController: createTag", () => {
  test("should create a tag and return 201 status", async () => {
    const mockTag = createMockTag(1, "Test Tag");
    const mockContext = createMockContext({
      requestBody: { name: "Test Tag" },
    });

    vi.mocked(Tags.createTag).mockResolvedValue(mockTag);

    await tagsController.createTag(mockContext);

    expect(Tags.createTag).toHaveBeenCalledWith({
      name: "Test Tag",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Test Tag",
      type: "meta",
      description: null,
      referenceCount: undefined,
    });
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { name: "Test Tag" },
    });

    const error = new Error("Database error");
    vi.mocked(Tags.createTag).mockRejectedValue(error);

    await expect(tagsController.createTag(mockContext)).rejects.toThrow(
      "Database error"
    );
  });
});

describe("tagsController: getAllTags", () => {
  test("should return all tags with 200 status", async () => {
    const mockTags = [createMockTag(1, "Tag 1"), createMockTag(2, "Tag 2")];
    const mockContext = createMockContext();

    vi.mocked(Tags.getAllTags).mockResolvedValue(mockTags);

    await tagsController.getAllTags(mockContext);

    expect(Tags.getAllTags).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Tag 1",
        type: "meta",
        description: null,
        referenceCount: undefined,
      },
      {
        id: 2,
        name: "Tag 2",
        type: "meta",
        description: null,
        referenceCount: undefined,
      },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockTags = [
      createMockTag(1, "Tag 1", { referenceCount: 5 }),
      createMockTag(2, "Tag 2", { referenceCount: 3 }),
    ];
    const mockContext = createMockContext({
      query: { referenceCount: true },
    });

    vi.mocked(Tags.getAllTags).mockResolvedValue(mockTags);

    await tagsController.getAllTags(mockContext);

    expect(Tags.getAllTags).toHaveBeenCalledWith({
      referenceCount: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Tag 1",
        type: "meta",
        description: null,
        referenceCount: 5,
      },
      {
        id: 2,
        name: "Tag 2",
        type: "meta",
        description: null,
        referenceCount: 3,
      },
    ]);
  });

  test("should return tags with references when requested", async () => {
    const now = new Date();
    const mockReference = {
      id: 1,
      name: "Sample Reference",
      referenceTypeId: 1,
      createdAt: now,
      updatedAt: now,
      language: null,
      clean: () => ({
        id: 1,
        name: "Sample Reference",
        referenceTypeId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        language: null,
      }),
    };

    const mockTags = [
      createMockTag(1, "Tag 1", { references: [mockReference] }),
    ];

    const mockContext = createMockContext({
      query: { references: true },
    });

    vi.mocked(Tags.getAllTags).mockResolvedValue(mockTags);

    await tagsController.getAllTags(mockContext);

    expect(Tags.getAllTags).toHaveBeenCalledWith({
      references: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Tag 1",
        type: "meta",
        description: null,
        referenceCount: undefined,
        references: [
          {
            id: 1,
            name: "Sample Reference",
            referenceTypeId: 1,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            language: null,
          },
        ],
      },
    ]);
  });

  test("should handle empty result set", async () => {
    const mockTags: Tag[] = [];
    const mockContext = createMockContext();

    vi.mocked(Tags.getAllTags).mockResolvedValue(mockTags);

    await tagsController.getAllTags(mockContext);

    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([]);
  });
});

describe("tagsController: getTagById", () => {
  test("should return a tag with 200 status when found", async () => {
    const mockTag = createMockTag(1, "Tag 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Tags.getTagById).mockResolvedValue(mockTag);

    await tagsController.getTagById(mockContext);

    expect(Tags.getTagById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Tag 1",
      type: "meta",
      description: null,
      referenceCount: undefined,
    });
  });

  test("should return 404 status when tag not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Tags.getTagById).mockResolvedValue(null);

    await tagsController.getTagById(mockContext);

    expect(Tags.getTagById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const now = new Date();
    const mockReference = {
      id: 1,
      name: "Sample Reference",
      referenceTypeId: 1,
      createdAt: now,
      updatedAt: now,
      language: null,
      clean: () => ({
        id: 1,
        name: "Sample Reference",
        referenceTypeId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        language: null,
      }),
    };

    const mockTag = createMockTag(1, "Tag 1", {
      references: [mockReference],
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      query: { references: true },
    });

    vi.mocked(Tags.getTagById).mockResolvedValue(mockTag);

    await tagsController.getTagById(mockContext);

    expect(Tags.getTagById).toHaveBeenCalledWith(1, {
      references: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Tag 1",
      type: "meta",
      description: null,
      referenceCount: undefined,
      references: [
        {
          id: 1,
          name: "Sample Reference",
          referenceTypeId: 1,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          language: null,
        },
      ],
    });
  });

  test("should handle string IDs correctly", async () => {
    const mockTag = createMockTag(1, "Tag 1");
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(Tags.getTagById).mockResolvedValue(mockTag);

    await tagsController.getTagById(mockContext);

    expect(Tags.getTagById).toHaveBeenCalledWith("1", {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});

describe("tagsController: updateTagById", () => {
  test("should update a tag and return 200 status when found", async () => {
    const mockTag = createMockTag(1, "Updated Tag");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Tag" },
    });

    vi.mocked(Tags.updateTagById).mockResolvedValue(mockTag);

    await tagsController.updateTagById(mockContext);

    expect(Tags.updateTagById).toHaveBeenCalledWith(1, {
      name: "Updated Tag",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Tag",
      type: "meta",
      description: null,
      referenceCount: undefined,
    });
  });

  test("should return 404 status when tag not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Tag" },
    });

    vi.mocked(Tags.updateTagById).mockResolvedValue(null);

    await tagsController.updateTagById(mockContext);

    expect(Tags.updateTagById).toHaveBeenCalledWith(999, {
      name: "Updated Tag",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data", async () => {
    const mockTag = createMockTag(1, "Updated Tag");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        name: "Updated Tag",
        description: "Important tag",
      },
    });

    vi.mocked(Tags.updateTagById).mockResolvedValue(mockTag);

    await tagsController.updateTagById(mockContext);

    expect(Tags.updateTagById).toHaveBeenCalledWith(1, {
      name: "Updated Tag",
      description: "Important tag",
    });
  });
});

describe("tagsController: deleteTagById", () => {
  test("should delete a tag and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Tags.deleteTagById).mockResolvedValue(1);

    await tagsController.deleteTagById(mockContext);

    expect(Tags.deleteTagById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when tag not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Tags.deleteTagById).mockResolvedValue(0);

    await tagsController.deleteTagById(mockContext);

    expect(Tags.deleteTagById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
