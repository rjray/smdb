/**
 * Test suite for the controller functions in the `controllers/referencesController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";
import { ReferenceData } from "@smdb-types/references";

import {
  Reference,
  Author,
  Tag,
  Book,
  MagazineFeature,
  PhotoCollection,
} from "../../src/models";
import { References } from "../../src/db";
import * as referencesController from "../../src/controllers/referencesController";

// Mock the References database module
vi.mock("../../src/db", () => ({
  References: {
    createReference: vi.fn(),
    getAllReferences: vi.fn(),
    getReferenceById: vi.fn(),
    updateReferenceById: vi.fn(),
    deleteReferenceById: vi.fn(),
  },
}));

// Helper to create a mock reference
const createMockReference = (
  id: number,
  name: string,
  options: {
    referenceTypeId?: number;
    tags?: Partial<Tag>[];
    authors?: Partial<Author>[];
    book?: Partial<Book>;
    magazineFeature?: Partial<MagazineFeature>;
    photoCollection?: Partial<PhotoCollection>;
  } = {}
): Reference => {
  const {
    referenceTypeId = 1,
    tags,
    authors,
    book,
    magazineFeature,
    photoCollection,
  } = options;
  const now = new Date();

  return {
    id,
    name,
    referenceTypeId,
    tags,
    authors,
    book,
    magazineFeature,
    photoCollection,
    createdAt: now,
    updatedAt: now,
    clean: () => {
      const result: ReferenceData = {
        id,
        name,
        referenceTypeId,
        language: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      if (tags) {
        const taglist = [];
        for (const tag of tags) {
          if (tag.clean && typeof tag.clean === "function")
            taglist.push(tag.clean());
        }

        result.tags = taglist;
      }

      if (authors) {
        const authorlist = [];
        for (const author of authors) {
          if (author.clean && typeof author.clean === "function")
            authorlist.push(author.clean());
        }

        result.authors = authorlist;
      }

      if (book) {
        if (book.clean && typeof book.clean === "function")
          result.book = book.clean();
      }

      if (magazineFeature) {
        if (
          magazineFeature.clean &&
          typeof magazineFeature.clean === "function"
        )
          result.magazineFeature = magazineFeature.clean();
      }

      if (photoCollection) {
        if (
          photoCollection.clean &&
          typeof photoCollection.clean === "function"
        )
          result.photoCollection = photoCollection.clean();
      }

      return result;
    },
  } as Reference;
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

describe("referencesController: createReference", () => {
  test("should create a book reference and return 201 status", async () => {
    const mockBook = {
      referenceId: 1,
      isbn: "1234567890",
      seriesNumber: null,
      clean: () => ({
        referenceId: 1,
        isbn: "1234567890",
        seriesNumber: null,
        seriesId: null,
        publisherId: null,
      }),
    };

    const mockReference = createMockReference(1, "Test Book Reference", {
      referenceTypeId: 1,
      book: mockBook,
    });

    const mockContext = createMockContext({
      requestBody: {
        name: "Test Book Reference",
        referenceTypeId: 1,
        book: { isbn: "1234567890" },
      },
    });

    vi.mocked(References.createReference).mockResolvedValue(mockReference);

    await referencesController.createReference(mockContext);

    expect(References.createReference).toHaveBeenCalledWith({
      name: "Test Book Reference",
      referenceTypeId: 1,
      book: { isbn: "1234567890" },
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockReference.clean()
    );
  });

  test("should create a magazine feature reference and return 201 status", async () => {
    const mockMagazineFeature = {
      referenceId: 1,
      magazineIssueId: 5,
      clean: () => ({ referenceId: 1, magazineIssueId: 5 }),
    };

    const mockReference = createMockReference(1, "Test Magazine Feature", {
      referenceTypeId: 2,
      magazineFeature: mockMagazineFeature,
    });

    const mockContext = createMockContext({
      requestBody: {
        name: "Test Magazine Feature",
        referenceTypeId: 2,
        magazineFeature: { magazineIssueId: 5 },
      },
    });

    vi.mocked(References.createReference).mockResolvedValue(mockReference);

    await referencesController.createReference(mockContext);

    expect(References.createReference).toHaveBeenCalledWith({
      name: "Test Magazine Feature",
      referenceTypeId: 2,
      magazineFeature: { magazineIssueId: 5 },
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockReference.clean()
    );
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: {
        name: "Test Reference",
        referenceTypeId: 1,
      },
    });

    const error = new Error("Database error");
    vi.mocked(References.createReference).mockRejectedValue(error);

    await expect(
      referencesController.createReference(mockContext)
    ).rejects.toThrow("Database error");
  });
});

describe("referencesController: getAllReferences", () => {
  test("should return all references with 200 status", async () => {
    const mockReferences = [
      createMockReference(1, "Reference 1", { referenceTypeId: 1 }),
      createMockReference(2, "Reference 2", { referenceTypeId: 2 }),
    ];
    const mockContext = createMockContext();

    vi.mocked(References.getAllReferences).mockResolvedValue(mockReferences);

    await referencesController.getAllReferences(mockContext);

    expect(References.getAllReferences).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      mockReferences[0].clean(),
      mockReferences[1].clean(),
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockTag = {
      id: 1,
      name: "Sample Tag",
      clean: () => ({
        id: 1,
        name: "Sample Tag",
        type: "meta",
        description: null,
        referenceCount: undefined,
      }),
    };

    const mockReferences = [
      createMockReference(1, "Reference 1", {
        referenceTypeId: 1,
        tags: [mockTag],
      }),
    ];

    const mockContext = createMockContext({
      query: { tags: true },
    });

    vi.mocked(References.getAllReferences).mockResolvedValue(mockReferences);

    await referencesController.getAllReferences(mockContext);

    expect(References.getAllReferences).toHaveBeenCalledWith({
      tags: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      mockReferences[0].clean(),
    ]);
  });

  test("should handle empty result set", async () => {
    const mockReferences: Reference[] = [];
    const mockContext = createMockContext();

    vi.mocked(References.getAllReferences).mockResolvedValue(mockReferences);

    await referencesController.getAllReferences(mockContext);

    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([]);
  });
});

describe("referencesController: getReferenceById", () => {
  test("should return a reference with 200 status when found", async () => {
    const mockReference = createMockReference(1, "Reference 1", {
      referenceTypeId: 1,
    });
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(References.getReferenceById).mockResolvedValue(mockReference);

    await referencesController.getReferenceById(mockContext);

    expect(References.getReferenceById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockReference.clean()
    );
  });

  test("should return 404 status when reference not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(References.getReferenceById).mockResolvedValue(null);

    await referencesController.getReferenceById(mockContext);

    expect(References.getReferenceById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const now = new Date();
    const mockAuthor = {
      id: 1,
      name: "Sample Author",
      createdAt: now,
      updatedAt: now,
      clean: () => ({
        id: 1,
        name: "Sample Author",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    };

    const mockReference = createMockReference(1, "Reference 1", {
      referenceTypeId: 1,
      authors: [mockAuthor],
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      query: { authors: true },
    });

    vi.mocked(References.getReferenceById).mockResolvedValue(mockReference);

    await referencesController.getReferenceById(mockContext);

    expect(References.getReferenceById).toHaveBeenCalledWith(1, {
      authors: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockReference.clean()
    );
  });

  test("should handle string IDs correctly", async () => {
    const mockReference = createMockReference(1, "Reference 1", {
      referenceTypeId: 1,
    });
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(References.getReferenceById).mockResolvedValue(mockReference);

    await referencesController.getReferenceById(mockContext);

    expect(References.getReferenceById).toHaveBeenCalledWith("1", {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});

describe("referencesController: updateReferenceById", () => {
  test("should update a reference and return 200 status when found", async () => {
    const mockReference = createMockReference(1, "Updated Reference", {
      referenceTypeId: 1,
    });
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Reference" },
    });

    vi.mocked(References.updateReferenceById).mockResolvedValue(mockReference);

    await referencesController.updateReferenceById(mockContext);

    expect(References.updateReferenceById).toHaveBeenCalledWith(1, {
      name: "Updated Reference",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockReference.clean()
    );
  });

  test("should return 404 status when reference not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Reference" },
    });

    vi.mocked(References.updateReferenceById).mockResolvedValue(null);

    await referencesController.updateReferenceById(mockContext);

    expect(References.updateReferenceById).toHaveBeenCalledWith(999, {
      name: "Updated Reference",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data including reference type change", async () => {
    const mockPhotoCollection = {
      referenceId: 1,
      location: "Sample Location",
      media: "Sample Media",
      clean: () => ({
        referenceId: 1,
        location: "Sample Location",
        media: "Sample Media",
      }),
    };
    const mockReferenceUpdated = createMockReference(1, "Updated Reference", {
      referenceTypeId: 2,
      photoCollection: mockPhotoCollection,
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        referenceTypeId: 2,
        photoCollection: {
          location: "Sample Location",
          media: "Sample Media",
        },
      },
    });

    vi.mocked(References.updateReferenceById).mockResolvedValue(
      mockReferenceUpdated
    );

    await referencesController.updateReferenceById(mockContext);

    expect(References.updateReferenceById).toHaveBeenCalledWith(1, {
      referenceTypeId: 2,
      photoCollection: {
        location: "Sample Location",
        media: "Sample Media",
      },
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      ...mockReferenceUpdated.clean(),
      referenceTypeId: 2,
    });
  });
});

describe("referencesController: deleteReferenceById", () => {
  test("should delete a reference and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(References.deleteReferenceById).mockResolvedValue(1);

    await referencesController.deleteReferenceById(mockContext);

    expect(References.deleteReferenceById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when reference not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(References.deleteReferenceById).mockResolvedValue(0);

    await referencesController.deleteReferenceById(mockContext);

    expect(References.deleteReferenceById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle string IDs correctly", async () => {
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(References.deleteReferenceById).mockResolvedValue(1);

    await referencesController.deleteReferenceById(mockContext);

    expect(References.deleteReferenceById).toHaveBeenCalledWith("1");
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});
