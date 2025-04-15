/**
 * Test suite for the database code in the `db/publishers.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Publishers, References, Series } from "../../src/db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Publishers: Create", () => {
  test("Create basic publisher", async () => {
    const publisher = await Publishers.createPublisher({
      name: "Publisher 1",
    });

    expect(publisher.id).toBe(1);
    expect(publisher.name).toBe("Publisher 1");
  });

  test("Create feature tag with conflicting name", async () => {
    async function failToCreate() {
      return await Publishers.createPublisher({
        name: "Publisher 1",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("Publishers: Retrieve", () => {
  beforeAll(async () => {
    // Create a few references for the publisher.
    for (const referenceId of [1, 2, 3, 4, 5]) {
      await References.createReference({
        name: `Reference ${referenceId}`,
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        book: {
          publisherId: 1,
        },
      });
    }
    // Create a few series for the publisher, as well.
    for (const seriesId of [1, 2, 3, 4, 5]) {
      await Series.createSeries({
        name: `Series ${seriesId}`,
        publisherId: 1,
      });
    }
    // Create two more series that aren't associated with the publisher.
    for (const seriesId of [6, 7]) {
      await Series.createSeries({
        name: `Series ${seriesId}`,
      });
    }
  });
  test("Get all publishers", async () => {
    const publishers = await Publishers.getAllPublishers();
    expect(publishers.length).toBe(1);
    expect(publishers[0].id).toBe(1);
    expect(publishers[0].name).toBe("Publisher 1");
  });

  test("Get basic publisher by ID", async () => {
    const publisher = await Publishers.getPublisherById(1);
    if (publisher) {
      expect(publisher.id).toBe(1);
      expect(publisher.name).toBe("Publisher 1");
    } else {
      assert.fail("Publisher not found");
    }
  });

  test("Get publisher by ID with books", async () => {
    const publisher = await Publishers.getPublisherById(1, {
      books: true,
    });
    if (publisher) {
      expect(publisher.id).toBe(1);
      expect(publisher.name).toBe("Publisher 1");
      if (publisher.books) {
        expect(publisher.books.length).toBe(5);
      } else {
        assert.fail("Publisher's books not found");
      }
    } else {
      assert.fail("Publisher not found");
    }
  });

  test("Get publisher by ID with series", async () => {
    const publisher = await Publishers.getPublisherById(1, {
      series: true,
    });
    if (publisher) {
      expect(publisher.id).toBe(1);
      expect(publisher.name).toBe("Publisher 1");
      if (publisher.series) {
        expect(publisher.series.length).toBe(5);
      } else {
        assert.fail("Publisher's series not found");
      }
    } else {
      assert.fail("Publisher not found");
    }
  });
});

describe("Publishers: Update", () => {
  test("Update basic publisher", async () => {
    const publisher = await Publishers.updatePublisherById(1, {
      name: "Publisher 1 Updated",
    });

    if (publisher) {
      expect(publisher.id).toBe(1);
      expect(publisher.name).toBe("Publisher 1 Updated");
    } else {
      assert.fail("Publisher not found");
    }
  });
});

describe("Publishers: Delete", () => {
  test("Delete basic publisher", async () => {
    const deleted = await Publishers.deletePublisherById(1);
    expect(deleted).toBe(1);

    // Ensure that no series or references were deleted.
    const references = await References.getAllReferences();
    expect(references.length).toBe(5);
    const series = await Series.getAllSeries();
    expect(series.length).toBe(7);
  });
});
