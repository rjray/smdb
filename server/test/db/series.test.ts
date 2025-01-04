/**
 * Test suite for the database code in the `db/series.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Publishers, References, Series } from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();

  // Create one publisher here for use in the tests.
  await Publishers.createPublisher({
    name: "Publisher 1",
  });
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Series: Create", () => {
  test("Create basic series with no publisher", async () => {
    const series = await Series.createSeries({
      name: "Series 1",
    });

    expect(series.id).toBe(1);
    expect(series.name).toBe("Series 1");
    expect(series.publisherId).toBeUndefined();
  });

  test("Create series with conflicting name (1)", async () => {
    async function failToCreate() {
      return await Series.createSeries({
        name: "Series 1",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });

  test("Create series with publisher", async () => {
    const series = await Series.createSeries({
      name: "Series 2",
      publisherId: 1,
    });

    expect(series.id).toBe(2);
    expect(series.name).toBe("Series 2");
    expect(series.publisherId).toBe(1);
  });

  test("Create series with conflicting name (2)", async () => {
    async function failToCreate() {
      return await Series.createSeries({
        name: "Series 2",
        publisherId: 1,
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });

  test("Create series with conflicting name (3)", async () => {
    const series = await Series.createSeries({
      name: "Series 2",
    });

    expect(series.id).toBe(3);
    expect(series.name).toBe("Series 2");
    expect(series.publisherId).toBeUndefined();
  });
});

describe("Series: Retrieve", () => {
  beforeAll(async () => {
    // Create a few references for the two series.

    // Create five for the first series (no publisher).
    for (const referenceId of [1, 2, 3, 4, 5]) {
      await References.createReference({
        name: `Reference ${referenceId}`,
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        book: {
          seriesId: 1,
        },
      });
    }
    // Create five for the second series (with publisher).
    for (const referenceId of [6, 7, 8, 9, 10]) {
      await References.createReference({
        name: `Reference ${referenceId}`,
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        book: {
          seriesId: 2,
          publisherId: 1,
        },
      });
    }
  });

  test("Get all series", async () => {
    const series = await Series.getAllSeries();
    expect(series.length).toBe(3);
    expect(series[0].id).toBe(1);
    expect(series[0].name).toBe("Series 1");
  });

  test("Get basic series by ID", async () => {
    const series = await Series.getSeriesById(1);
    if (series) {
      expect(series.id).toBe(1);
      expect(series.name).toBe("Series 1");
      expect(series.books).toBeUndefined();
      expect(series.publisher).toBeUndefined();
    } else {
      assert.fail("Series not found");
    }
  });

  test("Get series by ID with books", async () => {
    const series = await Series.getSeriesById(1, {
      books: true,
    });
    if (series) {
      expect(series.id).toBe(1);
      expect(series.name).toBe("Series 1");
      if (series.books) {
        expect(series.books.length).toBe(5);
      } else {
        assert.fail("Series books not found");
      }
    } else {
      assert.fail("Series not found");
    }
  });

  test("Get series by ID with publisher", async () => {
    const series = await Series.getSeriesById(2, {
      publisher: true,
    });
    if (series) {
      expect(series.id).toBe(2);
      expect(series.name).toBe("Series 2");
      if (series.publisher) {
        expect(series.publisher.id).toBe(1);
        expect(series.publisher.name).toBe("Publisher 1");
      } else {
        assert.fail("Series publisher not found");
      }
    } else {
      assert.fail("Series not found");
    }
  });
});

describe("Series: Update", () => {
  test("Update basic series", async () => {
    const series = await Series.updateSeriesById(1, {
      name: "Series 1 Updated",
    });

    if (series) {
      expect(series.id).toBe(1);
      expect(series.name).toBe("Series 1 Updated");
    } else {
      assert.fail("Series not found");
    }
  });
});

describe("Series: Delete", () => {
  test("Delete basic series", async () => {
    const deleted = await Series.deleteSeriesById(1);
    expect(deleted).toBe(1);

    // Ensure that no series or references were deleted.
    const references = await References.getAllReferences();
    expect(references.length).toBe(10);
    const series = await Series.getAllSeries();
    expect(series.length).toBe(2);
  });
});
