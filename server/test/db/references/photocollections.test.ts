/**
 * Test suite for the database code in the `db/references.ts` module.
 *
 * This suite covers the `PhotoCollection` type of reference.
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  assert,
} from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../../database";
import { Authors, References } from "../../../src/db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../../src/constants";
import { PhotoCollection } from "../../../src/models";

beforeAll(async () => {
  await setupTestDatabase();

  // Create some baseline data here, before tests run. This way, if only a
  // single test runs it will still have basic data on hand.

  // Authors
  for (const id of [1, 2, 3, 4, 5]) {
    await Authors.createAuthor({
      name: `Author ${id}`,
      id,
    });
  }

  // Create a single baseline photo collection for testing an empty update
  // later on.
  await References.createReference({
    name: "Baseline Photo Collection Reference 1",
    referenceTypeId: ReferenceTypes.PhotoCollection,
    tags: [{ id: 1 }, { id: 2 }],
    authors: [{ id: 1 }, { id: 2 }],
    photoCollection: {
      location: "Baseline Location 1",
      media: "Baseline Media 1",
    },
  });
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("References: Photo Collections: Create", () => {
  // Because the Photo Collection sub-type is the simplest of the three, I will
  // use this block of tests to exercise the logic around authors and tags in
  // terms of error-checking and auto-creation of new records.

  test("Add photo collection reference", async () => {
    const reference = await References.createReference({
      name: "Photo Collection Reference 1",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ name: "Author 1", id: 1 }, { id: 2 }],
      photoCollection: {
        location: "Location 1",
        media: "Media 1",
      },
    });

    expect(reference).toBeDefined();
    expect(reference.referenceTypeId).toBe(ReferenceTypes.PhotoCollection);
    expect(reference.photoCollection).toBeDefined();
  });

  test("No authors", async () => {
    const reference = await References.createReference({
      name: "Photo Collection Reference 2",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ id: 1 }, { id: 2 }],
      photoCollection: {
        location: "Location 2",
        media: "Media 2",
      },
    });

    expect(reference).toBeDefined();
    expect(reference.referenceTypeId).toBe(ReferenceTypes.PhotoCollection);
    expect(reference.photoCollection).toBeDefined();
  });

  test("New tags/authors", async () => {
    const reference = await References.createReference({
      name: "Photo Collection Reference 3",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ name: "New Tag 1" }, { name: "New Tag 2" }],
      authors: [{ name: "New Author 1" }, { name: "New Author 2" }],
      photoCollection: {
        location: "Location 3",
        media: "Media 3",
      },
    });

    expect(reference).toBeDefined();
    expect(reference.referenceTypeId).toBe(ReferenceTypes.PhotoCollection);
    expect(reference.photoCollection).toBeDefined();

    const newReference = await References.getReferenceById(reference.id, {
      tags: true,
      authors: true,
    });
    if (newReference) {
      if (newReference.tags) {
        expect(newReference.tags.length).toBe(2);
        expect(newReference.tags[0].name).toBe("New Tag 1");
        expect(newReference.tags[1].name).toBe("New Tag 2");
      } else {
        assert.fail("No tags found");
      }
      if (newReference.authors) {
        expect(newReference.authors.length).toBe(2);
        expect(newReference.authors[0].name).toBe("New Author 1");
        expect(newReference.authors[1].name).toBe("New Author 2");
      } else {
        assert.fail("No authors found");
      }
    } else {
      assert.fail("Created reference not found");
    }
  });

  test("Missing collection data", async () => {
    async function failToCreate() {
      return await References.createReference({
        name: "Photo Collection Reference 4",
        referenceTypeId: ReferenceTypes.PhotoCollection,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ name: "Author 1", id: 1 }, { id: 2 }],
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError(
      "Reference must have photo collection data"
    );
  });

  test("Missing tags", async () => {
    async function failToCreate() {
      return await References.createReference({
        name: "Photo Collection Reference 5",
        referenceTypeId: ReferenceTypes.PhotoCollection,
        tags: [],
        authors: [{ name: "Author 1", id: 1 }, { id: 2 }],
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError(
      "Reference must have at least one tag"
    );
  });
});

describe("References: Photo Collections: Retrieve", () => {
  // Create a handful of references for the tests to operate on
  beforeAll(async () => {
    await References.createReference({
      name: "Photo Collection Reference 1",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      photoCollection: {
        location: "Location 1",
        media: "Media 1",
      },
    });
    await References.createReference({
      name: "Photo Collection Reference 2",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      photoCollection: {
        location: "Location 2",
        media: "Media 2",
      },
    });
  });

  test("Get all references", async () => {
    const references = await References.getAllReferences();

    expect(references.length >= 3).toBe(true);
  });

  test("Get reference by ID", async () => {
    const reference = await References.getReferenceById(1);

    expect(reference).toBeDefined();
  });

  test("Get reference by ID with authors and tags", async () => {
    const reference = await References.getReferenceById(1, {
      authors: true,
      tags: true,
    });

    expect(reference).toBeDefined();

    if (reference) {
      const cleaned = reference.clean();
      const { createdAt, updatedAt, authors } = cleaned;

      if (authors && authors.length === 2) {
        const createdVals = authors.map((author) => author.createdAt);
        const updatedVals = authors.map((author) => author.updatedAt);

        expect(cleaned).toEqual({
          id: 1,
          name: "Baseline Photo Collection Reference 1",
          language: null,
          referenceTypeId: ReferenceTypes.PhotoCollection,
          createdAt: createdAt,
          updatedAt: updatedAt,
          photoCollection: {
            location: "Baseline Location 1",
            media: "Baseline Media 1",
            referenceId: 1,
          },
          authors: [
            {
              id: 1,
              name: "Author 1",
              createdAt: createdVals[0],
              updatedAt: updatedVals[0],
            },
            {
              id: 2,
              name: "Author 2",
              createdAt: createdVals[1],
              updatedAt: updatedVals[1],
            },
          ],
          tags: [
            {
              id: 1,
              name: "aircraft",
              type: "meta",
              description: "An aircraft subject",
            },
            {
              id: 2,
              name: "armor",
              type: "meta",
              description: "A ground vehicle subject",
            },
          ],
        });
      } else {
        assert.fail("Authors not found or wrong length");
      }
    } else {
      assert.fail("Reference not found");
    }
  });
});

describe("References: Photo Collections: Update", () => {
  let photoCollectionId: number;

  beforeEach(async () => {
    photoCollectionId = (
      await References.createReference({
        name: "Photo Collection Reference",
        referenceTypeId: ReferenceTypes.PhotoCollection,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        photoCollection: {
          location: "Location",
          media: "Media",
        },
      })
    ).id;
  });

  test("Basic photo collection update", async () => {
    const reference = await References.updateReferenceById(photoCollectionId, {
      photoCollection: {
        location: "Updated Location",
        media: "Updated Media",
      },
    });

    expect(reference).toBeDefined();
    expect(reference?.name).toBe("Photo Collection Reference");
    expect(reference?.photoCollection?.location).toBe("Updated Location");
    expect(reference?.photoCollection?.media).toBe("Updated Media");
  });

  // Testing the updating of authors and tags, and testing an empty update,
  // are things that only need to be done once. They won't be different for
  // the other reference types.

  test("Update authors and tags", async () => {
    const reference = await References.updateReferenceById(photoCollectionId, {
      authors: [{ id: 3 }, { id: 4 }],
      tags: [{ id: 3 }, { id: 4 }],
    });

    expect(reference).toBeDefined();
    const updatedReference = await References.getReferenceById(
      photoCollectionId,
      {
        authors: true,
        tags: true,
      }
    );

    if (updatedReference) {
      const cleaned = updatedReference.clean();
      const { createdAt, updatedAt, authors } = cleaned;

      if (authors && authors.length === 2) {
        const createdVals = authors.map((author) => author.createdAt);
        const updatedVals = authors.map((author) => author.updatedAt);

        expect(cleaned).toEqual({
          id: photoCollectionId,
          name: "Photo Collection Reference",
          language: null,
          referenceTypeId: ReferenceTypes.PhotoCollection,
          createdAt,
          updatedAt,
          photoCollection: {
            referenceId: photoCollectionId,
            location: "Location",
            media: "Media",
          },
          authors: [
            {
              id: 3,
              name: "Author 3",
              createdAt: createdVals[0],
              updatedAt: updatedVals[0],
            },
            {
              id: 4,
              name: "Author 4",
              createdAt: createdVals[1],
              updatedAt: updatedVals[1],
            },
          ],
          tags: [
            {
              id: 3,
              name: "figures",
              type: "meta",
              description: "A figurine subject",
            },
            {
              id: 4,
              name: "scifi",
              type: "meta",
              description: "A science fiction/fantasy subject",
            },
          ],
        });
      } else {
        assert.fail("Authors not found or wrong length");
      }
    } else {
      assert.fail("Updated reference not found");
    }
  });

  test("No changes", async () => {
    const reference = await References.getReferenceById(1);
    expect(reference).toBeDefined();
    const initialUpdatedAt = reference?.updatedAt;
    const updatedReference = await References.updateReferenceById(1, {});
    expect(updatedReference?.updatedAt).toStrictEqual(initialUpdatedAt);
  });
});

describe("References: Photo Collections: Delete", () => {
  test("Delete reference", async () => {
    const deleted = await References.deleteReferenceById(1);

    expect(deleted).toBe(1);

    const dataRecord = await PhotoCollection.findByPk(1);
    expect(dataRecord).toBeNull();
  });
});
