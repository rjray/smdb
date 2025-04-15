/**
 * Test suite for the database code in the `db/referencetypes.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { ReferenceTypes, References } from "../../src/db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes as ReferenceTypesEnum } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();

  // Create a few references for the "Book" reference type.
  for (const referenceId of [1, 2, 3, 4, 5]) {
    await References.createReference({
      name: `Reference ${referenceId}`,
      referenceTypeId: ReferenceTypesEnum.Book,
      tags: [{ id: 1 }, { id: 2 }],
      book: {},
    });
  }
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("ReferenceTypes: Retrieve", () => {
  test("Get all reference types", async () => {
    const referenceTypes = await ReferenceTypes.getAllReferenceTypes();

    expect(referenceTypes.length).toBe(3);
    expect(referenceTypes[0].id).toBe(1);
    expect(referenceTypes[0].name).toBe("book");
  });

  test("Get all reference types with reference counts", async () => {
    const referenceTypes = await ReferenceTypes.getAllReferenceTypes({
      referenceCount: true,
    });

    const counts = [5, 0, 0, 0];
    referenceTypes.forEach((referenceType, i) => {
      expect(referenceType.referenceCount).toBe(counts[i]);
    });
  });

  test("Get reference type by ID", async () => {
    const referenceType = await ReferenceTypes.getReferenceTypeById(1);

    if (referenceType) {
      expect(referenceType.id).toBe(1);
      expect(referenceType.name).toBe("book");
    } else {
      assert.fail("No reference type found");
    }
  });

  test("Get reference type by ID with references", async () => {
    const referenceType = await ReferenceTypes.getReferenceTypeById(1, {
      references: true,
    });

    if (referenceType) {
      expect(referenceType.id).toBe(1);
      expect(referenceType.name).toBe("book");
      if (referenceType.references) {
        expect(referenceType.references.length).toBe(5);
      } else {
        assert.fail("No referenceType.references found");
      }
    } else {
      assert.fail("No reference type found");
    }
  });
});

// There are no delete or update features for reference types.
