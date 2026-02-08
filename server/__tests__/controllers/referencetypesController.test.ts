/**
 * Test suite for the controller functions in the `controllers/referencetypesController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";
import { ReferenceTypeData } from "@smdb-types/reference-types";

import { Reference, ReferenceType } from "../../src/models";
import { ReferenceTypes } from "../../src/db";
import * as referencetypesController from "../../src/controllers/referencetypesController";

// Mock the ReferenceTypes database module
vi.mock("../../src/db", () => ({
  ReferenceTypes: {
    getAllReferenceTypes: vi.fn(),
    getReferenceTypeById: vi.fn(),
  },
}));

// Helper to create a mock referenceType
const createMockReferenceType = (
  id: number,
  name: string,
  options: {
    referenceCount?: number;
    references?: Partial<Reference>[];
  } = {}
): ReferenceType => {
  const { referenceCount, references } = options;

  return {
    id,
    name,
    description: `Reference Type ${id}`,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    referenceCount,
    references,
    clean: () => {
      const result: ReferenceTypeData = {
        id,
        name,
        description: "",
        notes: null,
      };
      if (referenceCount !== undefined) {
        result.referenceCount = referenceCount;
      }
      if (references) {
        const refs = [];
        for (const ref of references) {
          if (ref.clean && typeof ref.clean === "function")
            refs.push(ref.clean());
        }

        result.references = refs;
      }
      return result;
    },
  } as ReferenceType;
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

describe("referencetypesController: getAllReferenceTypes", () => {
  test("should return all referenceTypes with 200 status", async () => {
    const mockReferenceTypes = [
      createMockReferenceType(1, "book"),
      createMockReferenceType(2, "magazine"),
      createMockReferenceType(3, "article"),
    ];
    const mockContext = createMockContext();

    vi.mocked(ReferenceTypes.getAllReferenceTypes).mockResolvedValue(
      mockReferenceTypes
    );

    await referencetypesController.getAllReferenceTypes(mockContext);

    expect(ReferenceTypes.getAllReferenceTypes).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      { id: 1, name: "book", description: "", notes: null },
      { id: 2, name: "magazine", description: "", notes: null },
      { id: 3, name: "article", description: "", notes: null },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockReferenceTypes = [
      createMockReferenceType(1, "book", { referenceCount: 5 }),
      createMockReferenceType(2, "magazine", { referenceCount: 3 }),
    ];
    const mockContext = createMockContext({
      query: { referenceCount: true },
    });

    vi.mocked(ReferenceTypes.getAllReferenceTypes).mockResolvedValue(
      mockReferenceTypes
    );

    await referencetypesController.getAllReferenceTypes(mockContext);

    expect(ReferenceTypes.getAllReferenceTypes).toHaveBeenCalledWith({
      referenceCount: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      { id: 1, name: "book", referenceCount: 5, description: "", notes: null },
      {
        id: 2,
        name: "magazine",
        referenceCount: 3,
        description: "",
        notes: null,
      },
    ]);
  });

  test("should handle empty result set", async () => {
    const mockReferenceTypes: ReferenceType[] = [];
    const mockContext = createMockContext();

    vi.mocked(ReferenceTypes.getAllReferenceTypes).mockResolvedValue(
      mockReferenceTypes
    );

    await referencetypesController.getAllReferenceTypes(mockContext);

    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([]);
  });
});

describe("referencetypesController: getReferenceTypeById", () => {
  test("should return a referenceType with 200 status when found", async () => {
    const mockReferenceType = createMockReferenceType(1, "book");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(ReferenceTypes.getReferenceTypeById).mockResolvedValue(
      mockReferenceType
    );

    await referencetypesController.getReferenceTypeById(mockContext);

    expect(ReferenceTypes.getReferenceTypeById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "book",
      description: "",
      notes: null,
    });
  });

  test("should return 404 status when referenceType not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(ReferenceTypes.getReferenceTypeById).mockResolvedValue(null);

    await referencetypesController.getReferenceTypeById(mockContext);

    expect(ReferenceTypes.getReferenceTypeById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const now = new Date();

    const mockReference = {
      id: 1,
      name: "Sample Reference",
      referenceTypeId: 1,
      description: "",
      notes: null,
      language: null,
      createdAt: now,
      updatedAt: now,
      clean: () => ({
        id: 1,
        name: "Sample Reference",
        referenceTypeId: 1,
        description: "",
        notes: null,
        language: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    };

    const mockReferenceType = createMockReferenceType(1, "book", {
      references: [mockReference],
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      query: { references: true },
    });

    vi.mocked(ReferenceTypes.getReferenceTypeById).mockResolvedValue(
      mockReferenceType
    );

    await referencetypesController.getReferenceTypeById(mockContext);

    expect(ReferenceTypes.getReferenceTypeById).toHaveBeenCalledWith(1, {
      references: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "book",
      description: "",
      notes: null,
      references: [mockReference.clean()],
    });
  });

  test("should handle string IDs correctly", async () => {
    const mockReferenceType = createMockReferenceType(1, "book");
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(ReferenceTypes.getReferenceTypeById).mockResolvedValue(
      mockReferenceType
    );

    await referencetypesController.getReferenceTypeById(mockContext);

    expect(ReferenceTypes.getReferenceTypeById).toHaveBeenCalledWith("1", {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});
