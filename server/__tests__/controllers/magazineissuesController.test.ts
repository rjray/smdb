/**
 * Test suite for the controller functions in the `controllers/magazineissuesController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";

import { MagazineIssue } from "../../src/models";
import { MagazineIssues } from "../../src/db";
import * as magazineissuesController from "../../src/controllers/magazineissuesController";

// Mock the MagazineIssues database module
vi.mock("../../src/db", () => ({
  MagazineIssues: {
    createMagazineIssue: vi.fn(),
    getMagazineIssueById: vi.fn(),
    updateMagazineIssueById: vi.fn(),
    deleteMagazineIssueById: vi.fn(),
  },
}));

// Helper to create a mock magazine issue
const createMockMagazineIssue = (
  id: number,
  magazineId: number,
  issue: string
): MagazineIssue => {
  return {
    id,
    magazineId,
    issue,
    createdAt: new Date(),
    updatedAt: new Date(),
    clean: () => ({ id, magazineId, issue }),
  } as MagazineIssue;
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

describe("magazineissuesController: createMagazineIssue", () => {
  test("should create a magazine issue and return 201 status", async () => {
    const mockMagazineIssue = createMockMagazineIssue(1, 1, "Issue 1");
    const mockContext = createMockContext({
      requestBody: { magazineId: 1, issue: "Issue 1" },
    });

    vi.mocked(MagazineIssues.createMagazineIssue).mockResolvedValue(
      mockMagazineIssue
    );

    await magazineissuesController.createMagazineIssue(mockContext);

    expect(MagazineIssues.createMagazineIssue).toHaveBeenCalledWith({
      magazineId: 1,
      issue: "Issue 1",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      magazineId: 1,
      issue: "Issue 1",
    });
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { magazineId: 1, issue: "Issue 1" },
    });

    const error = new Error("Database error");
    vi.mocked(MagazineIssues.createMagazineIssue).mockRejectedValue(error);

    await expect(
      magazineissuesController.createMagazineIssue(mockContext)
    ).rejects.toThrow("Database error");
  });
});

describe("magazineissuesController: getMagazineIssueById", () => {
  test("should return a magazine issue with 200 status when found", async () => {
    const mockMagazineIssue = createMockMagazineIssue(1, 1, "Issue 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(MagazineIssues.getMagazineIssueById).mockResolvedValue(
      mockMagazineIssue
    );

    await magazineissuesController.getMagazineIssueById(mockContext);

    expect(MagazineIssues.getMagazineIssueById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      magazineId: 1,
      issue: "Issue 1",
    });
  });

  test("should return 404 status when magazine issue not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(MagazineIssues.getMagazineIssueById).mockResolvedValue(null);

    await magazineissuesController.getMagazineIssueById(mockContext);

    expect(MagazineIssues.getMagazineIssueById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const mockMagazineIssue = createMockMagazineIssue(1, 1, "Issue 1");
    const mockContext = createMockContext({
      path: { id: 1 },
      query: { magazine: true, features: true },
    });

    vi.mocked(MagazineIssues.getMagazineIssueById).mockResolvedValue(
      mockMagazineIssue
    );

    await magazineissuesController.getMagazineIssueById(mockContext);

    expect(MagazineIssues.getMagazineIssueById).toHaveBeenCalledWith(1, {
      magazine: true,
      features: true,
    });
  });
});

describe("magazineissuesController: updateMagazineIssueById", () => {
  test("should update a magazine issue and return 200 status when found", async () => {
    const mockMagazineIssue = createMockMagazineIssue(1, 1, "Updated Issue");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { issue: "Updated Issue" },
    });

    vi.mocked(MagazineIssues.updateMagazineIssueById).mockResolvedValue(
      mockMagazineIssue
    );

    await magazineissuesController.updateMagazineIssueById(mockContext);

    expect(MagazineIssues.updateMagazineIssueById).toHaveBeenCalledWith(1, {
      issue: "Updated Issue",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      magazineId: 1,
      issue: "Updated Issue",
    });
  });

  test("should return 404 status when magazine issue not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { issue: "Updated Issue" },
    });

    vi.mocked(MagazineIssues.updateMagazineIssueById).mockResolvedValue(null);

    await magazineissuesController.updateMagazineIssueById(mockContext);

    expect(MagazineIssues.updateMagazineIssueById).toHaveBeenCalledWith(999, {
      issue: "Updated Issue",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data", async () => {
    const mockMagazineIssue = createMockMagazineIssue(1, 2, "Special Issue");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        issue: "Special Issue",
        magazineId: 2,
        notes: "Important issue",
      },
    });

    vi.mocked(MagazineIssues.updateMagazineIssueById).mockResolvedValue(
      mockMagazineIssue
    );

    await magazineissuesController.updateMagazineIssueById(mockContext);

    expect(MagazineIssues.updateMagazineIssueById).toHaveBeenCalledWith(1, {
      issue: "Special Issue",
      magazineId: 2,
      notes: "Important issue",
    });
  });
});

describe("magazineissuesController: deleteMagazineIssueById", () => {
  test("should delete a magazine issue and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(MagazineIssues.deleteMagazineIssueById).mockResolvedValue(1);

    await magazineissuesController.deleteMagazineIssueById(mockContext);

    expect(MagazineIssues.deleteMagazineIssueById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when magazine issue not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(MagazineIssues.deleteMagazineIssueById).mockResolvedValue(0);

    await magazineissuesController.deleteMagazineIssueById(mockContext);

    expect(MagazineIssues.deleteMagazineIssueById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
