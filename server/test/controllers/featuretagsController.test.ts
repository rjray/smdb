/**
 * Test suite for the controller functions in the `controllers/featuretagsController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";

import { FeatureTag } from "../../src/models";
import { FeatureTags } from "../../src/db";
import * as featuretagsController from "../../src/controllers/featuretagsController";

// Mock the FeatureTags database module
vi.mock("../../src/db", () => ({
  FeatureTags: {
    createFeatureTag: vi.fn(),
    getAllFeatureTags: vi.fn(),
    getFeatureTagById: vi.fn(),
    updateFeatureTagById: vi.fn(),
    deleteFeatureTagById: vi.fn(),
  },
}));

// Helper to create a mock feature tag
const createMockFeatureTag = (id: number, name: string): FeatureTag => {
  return {
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    clean: () => ({ id, name }),
  } as FeatureTag;
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

describe("featuretagsController: createFeatureTag", () => {
  test("should create a feature tag and return 201 status", async () => {
    const mockFeatureTag = createMockFeatureTag(1, "Test Feature");
    const mockContext = createMockContext({
      requestBody: { name: "Test Feature" },
    });

    vi.mocked(FeatureTags.createFeatureTag).mockResolvedValue(mockFeatureTag);

    await featuretagsController.createFeatureTag(mockContext);

    expect(FeatureTags.createFeatureTag).toHaveBeenCalledWith({
      name: "Test Feature",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Test Feature",
    });
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { name: "Test Feature" },
    });

    const error = new Error("Database error");
    vi.mocked(FeatureTags.createFeatureTag).mockRejectedValue(error);

    await expect(
      featuretagsController.createFeatureTag(mockContext)
    ).rejects.toThrow("Database error");
  });
});

describe("featuretagsController: getAllFeatureTags", () => {
  test("should return all feature tags with 200 status", async () => {
    const mockFeatureTags = [
      createMockFeatureTag(1, "Feature 1"),
      createMockFeatureTag(2, "Feature 2"),
    ];
    const mockContext = createMockContext();

    vi.mocked(FeatureTags.getAllFeatureTags).mockResolvedValue(mockFeatureTags);

    await featuretagsController.getAllFeatureTags(mockContext);

    expect(FeatureTags.getAllFeatureTags).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      { id: 1, name: "Feature 1" },
      { id: 2, name: "Feature 2" },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockFeatureTags = [createMockFeatureTag(1, "Feature 1")];
    const mockContext = createMockContext({
      query: { referenceCount: true },
    });

    vi.mocked(FeatureTags.getAllFeatureTags).mockResolvedValue(mockFeatureTags);

    await featuretagsController.getAllFeatureTags(mockContext);

    expect(FeatureTags.getAllFeatureTags).toHaveBeenCalledWith({
      referenceCount: true,
    });
  });
});

describe("featuretagsController: getFeatureTagById", () => {
  test("should return a feature tag with 200 status when found", async () => {
    const mockFeatureTag = createMockFeatureTag(1, "Feature 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(FeatureTags.getFeatureTagById).mockResolvedValue(mockFeatureTag);

    await featuretagsController.getFeatureTagById(mockContext);

    expect(FeatureTags.getFeatureTagById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Feature 1",
    });
  });

  test("should return 404 status when feature tag not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(FeatureTags.getFeatureTagById).mockResolvedValue(null);

    await featuretagsController.getFeatureTagById(mockContext);

    expect(FeatureTags.getFeatureTagById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const mockFeatureTag = createMockFeatureTag(1, "Feature 1");
    const mockContext = createMockContext({
      path: { id: 1 },
      query: { features: true },
    });

    vi.mocked(FeatureTags.getFeatureTagById).mockResolvedValue(mockFeatureTag);

    await featuretagsController.getFeatureTagById(mockContext);

    expect(FeatureTags.getFeatureTagById).toHaveBeenCalledWith(1, {
      features: true,
    });
  });
});

describe("featuretagsController: updateFeatureTagById", () => {
  test("should update a feature tag and return 200 status when found", async () => {
    const mockFeatureTag = createMockFeatureTag(1, "Updated Feature");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Feature" },
    });

    vi.mocked(FeatureTags.updateFeatureTagById).mockResolvedValue(
      mockFeatureTag
    );

    await featuretagsController.updateFeatureTagById(mockContext);

    expect(FeatureTags.updateFeatureTagById).toHaveBeenCalledWith(1, {
      name: "Updated Feature",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Feature",
    });
  });

  test("should return 404 status when feature tag not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Feature" },
    });

    vi.mocked(FeatureTags.updateFeatureTagById).mockResolvedValue(null);

    await featuretagsController.updateFeatureTagById(mockContext);

    expect(FeatureTags.updateFeatureTagById).toHaveBeenCalledWith(999, {
      name: "Updated Feature",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});

describe("featuretagsController: deleteFeatureTagById", () => {
  test("should delete a feature tag and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(FeatureTags.deleteFeatureTagById).mockResolvedValue(1);

    await featuretagsController.deleteFeatureTagById(mockContext);

    expect(FeatureTags.deleteFeatureTagById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when feature tag not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(FeatureTags.deleteFeatureTagById).mockResolvedValue(0);

    await featuretagsController.deleteFeatureTagById(mockContext);

    expect(FeatureTags.deleteFeatureTagById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
