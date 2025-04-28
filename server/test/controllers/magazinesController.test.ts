/**
 * Test suite for the controller functions in the `controllers/magazinesController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";

import { Magazine } from "../../src/models";
import { Magazines } from "../../src/db";
import * as magazinesController from "../../src/controllers/magazinesController";
import { MagazineData } from "@smdb-types/magazines";
import { MagazineIssueForReference } from "@smdb-types/magazine-issues";

// Mock the Magazines database module
vi.mock("../../src/db", () => ({
  Magazines: {
    createMagazine: vi.fn(),
    getAllMagazines: vi.fn(),
    getMagazineById: vi.fn(),
    getRecentlyUpdatedMagazines: vi.fn(),
    updateMagazineById: vi.fn(),
    deleteMagazineById: vi.fn(),
  },
}));

// Helper to create a mock magazine
const createMockMagazine = (
  id: number,
  name: string,
  options: {
    language?: string;
    issues?: MagazineIssueForReference[];
  } = {}
): Magazine => {
  const { language = null, issues = undefined } = options;
  const now = new Date();

  return {
    id,
    name,
    language,
    issues,
    aliases: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    clean: () => {
      const result: MagazineData = {
        id,
        name,
        language,
        aliases: null,
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      if (issues) {
        result.issues = issues;
      }
      return result;
    },
  } as Magazine;
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

describe("magazinesController: createMagazine", () => {
  test("should create a magazine and return 201 status", async () => {
    const mockMagazine = createMockMagazine(1, "Test Magazine");
    const mockContext = createMockContext({
      requestBody: { name: "Test Magazine" },
    });

    vi.mocked(Magazines.createMagazine).mockResolvedValue(mockMagazine);

    await magazinesController.createMagazine(mockContext);

    expect(Magazines.createMagazine).toHaveBeenCalledWith({
      name: "Test Magazine",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(mockMagazine.clean());
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { name: "Test Magazine" },
    });

    const error = new Error("Database error");
    vi.mocked(Magazines.createMagazine).mockRejectedValue(error);

    await expect(
      magazinesController.createMagazine(mockContext)
    ).rejects.toThrow("Database error");
  });
});

describe("magazinesController: getAllMagazines", () => {
  test("should return all magazines with 200 status", async () => {
    const mockMagazines = [
      createMockMagazine(1, "Magazine 1"),
      createMockMagazine(2, "Magazine 2"),
    ];
    const mockContext = createMockContext();

    vi.mocked(Magazines.getAllMagazines).mockResolvedValue(mockMagazines);

    await magazinesController.getAllMagazines(mockContext);

    expect(Magazines.getAllMagazines).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith(
      mockMagazines.map((m) => m.clean())
    );
  });

  test("should pass query parameters to the database layer", async () => {
    const mockMagazines = [createMockMagazine(1, "Magazine 1")];
    const mockContext = createMockContext({
      query: { issues: true },
    });

    vi.mocked(Magazines.getAllMagazines).mockResolvedValue(mockMagazines);

    await magazinesController.getAllMagazines(mockContext);

    expect(Magazines.getAllMagazines).toHaveBeenCalledWith({
      issues: true,
    });
  });

  test("should return magazines with issues when requested", async () => {
    const now = new Date().toISOString();

    const mockIssue = {
      id: 1,
      issue: "Issue 1",
      magazineId: 1,
      createdAt: now,
      updatedAt: now,
    };

    const mockMagazines = [
      createMockMagazine(1, "Magazine 1", { issues: [mockIssue] }),
    ];

    const mockContext = createMockContext({
      query: { issues: true },
    });

    vi.mocked(Magazines.getAllMagazines).mockResolvedValue(mockMagazines);

    await magazinesController.getAllMagazines(mockContext);

    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Magazine 1",
        language: null,
        aliases: null,
        notes: null,
        createdAt: mockMagazines[0].createdAt.toISOString(),
        updatedAt: mockMagazines[0].updatedAt.toISOString(),
        issues: [
          {
            id: 1,
            issue: "Issue 1",
            magazineId: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ]);
  });
});

describe("magazinesController: getMagazineById", () => {
  test("should return a magazine with 200 status when found", async () => {
    const mockMagazine = createMockMagazine(1, "Magazine 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Magazines.getMagazineById).mockResolvedValue(mockMagazine);

    await magazinesController.getMagazineById(mockContext);

    expect(Magazines.getMagazineById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Magazine 1",
      language: null,
      aliases: null,
      notes: null,
      createdAt: mockMagazine.createdAt.toISOString(),
      updatedAt: mockMagazine.updatedAt.toISOString(),
    });
  });

  test("should return 404 status when magazine not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Magazines.getMagazineById).mockResolvedValue(null);

    await magazinesController.getMagazineById(mockContext);

    expect(Magazines.getMagazineById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const mockMagazine = createMockMagazine(1, "Magazine 1");
    const mockContext = createMockContext({
      path: { id: 1 },
      query: { issues: true },
    });

    vi.mocked(Magazines.getMagazineById).mockResolvedValue(mockMagazine);

    await magazinesController.getMagazineById(mockContext);

    expect(Magazines.getMagazineById).toHaveBeenCalledWith(1, {
      issues: true,
    });
  });
});

describe("magazinesController: getMostRecentUpdatedMagazines", () => {
  test("should return recently updated magazines with 200 status", async () => {
    const mockMagazines = [
      createMockMagazine(1, "Magazine 1"),
      createMockMagazine(2, "Magazine 2"),
    ];
    const mockContext = createMockContext();

    vi.mocked(Magazines.getRecentlyUpdatedMagazines).mockResolvedValue(
      mockMagazines
    );

    await magazinesController.getMostRecentUpdatedMagazines(mockContext);

    expect(Magazines.getRecentlyUpdatedMagazines).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Magazine 1",
        language: null,
        aliases: null,
        notes: null,
        createdAt: mockMagazines[0].createdAt.toISOString(),
        updatedAt: mockMagazines[0].updatedAt.toISOString(),
      },
      {
        id: 2,
        name: "Magazine 2",
        language: null,
        aliases: null,
        notes: null,
        createdAt: mockMagazines[1].createdAt.toISOString(),
        updatedAt: mockMagazines[1].updatedAt.toISOString(),
      },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockMagazines = [createMockMagazine(1, "Magazine 1")];
    const mockContext = createMockContext({
      query: { limit: 5, issues: true },
    });

    vi.mocked(Magazines.getRecentlyUpdatedMagazines).mockResolvedValue(
      mockMagazines
    );

    await magazinesController.getMostRecentUpdatedMagazines(mockContext);

    expect(Magazines.getRecentlyUpdatedMagazines).toHaveBeenCalledWith({
      limit: 5,
      issues: true,
    });
  });
});

describe("magazinesController: updateMagazineById", () => {
  test("should update a magazine and return 200 status when found", async () => {
    const mockMagazine = createMockMagazine(1, "Updated Magazine", {
      language: "English",
    });
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Magazine", language: "English" },
    });

    vi.mocked(Magazines.updateMagazineById).mockResolvedValue(mockMagazine);

    await magazinesController.updateMagazineById(mockContext);

    expect(Magazines.updateMagazineById).toHaveBeenCalledWith(1, {
      name: "Updated Magazine",
      language: "English",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Magazine",
      language: "English",
      aliases: null,
      notes: null,
      createdAt: mockMagazine.createdAt.toISOString(),
      updatedAt: mockMagazine.updatedAt.toISOString(),
    });
  });

  test("should return 404 status when magazine not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Magazine" },
    });

    vi.mocked(Magazines.updateMagazineById).mockResolvedValue(null);

    await magazinesController.updateMagazineById(mockContext);

    expect(Magazines.updateMagazineById).toHaveBeenCalledWith(999, {
      name: "Updated Magazine",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data", async () => {
    const mockMagazine = createMockMagazine(1, "Updated Magazine", {
      language: "English",
    });
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        name: "Updated Magazine",
        language: "English",
        notes: "Important magazine",
        aliases: ["Alias 1", "Alias 2"],
      },
    });

    vi.mocked(Magazines.updateMagazineById).mockResolvedValue(mockMagazine);

    await magazinesController.updateMagazineById(mockContext);

    expect(Magazines.updateMagazineById).toHaveBeenCalledWith(1, {
      name: "Updated Magazine",
      language: "English",
      notes: "Important magazine",
      aliases: ["Alias 1", "Alias 2"],
    });
  });
});

describe("magazinesController: deleteMagazineById", () => {
  test("should delete a magazine and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Magazines.deleteMagazineById).mockResolvedValue(1);

    await magazinesController.deleteMagazineById(mockContext);

    expect(Magazines.deleteMagazineById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when magazine not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Magazines.deleteMagazineById).mockResolvedValue(0);

    await magazinesController.deleteMagazineById(mockContext);

    expect(Magazines.deleteMagazineById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
