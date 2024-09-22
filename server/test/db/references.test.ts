/**
 * Test suite for the database code in the `db/references.ts` module.
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
import fs from "fs";

import setupDatabase from "database/setup";
import {
  Authors,
  Magazines,
  MagazineIssues,
  Publishers,
  References,
  Series,
} from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";
import { PhotoCollection } from "models";

// Need to have this here in case the test file is an actual file rather than
// an in-memory database.
const file = process.env.DATABASE_FILE || ":memory:";

beforeAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  await setupDatabase("src");

  // Create some baseline data here, before tests run. This way, if only a
  // single test runs, it will still have basic data on hand.

  // Magazines and Issues
  for (const id of [1, 2, 3, 4, 5]) {
    await Magazines.createMagazine({
      name: `Magazine ${id}`,
      id,
    });

    for (const i of [1, 2, 3, 4, 5]) {
      await MagazineIssues.createMagazineIssue({
        magazineId: id,
        issue: String(i),
      });
    }
  }

  // Publishers
  for (const id of [1, 2]) {
    await Publishers.createPublisher({
      name: `Publisher ${id}`,
      id,
    });
  }

  // Series - one tied to a publisher, one not
  await Series.createSeries({
    name: "Series 1",
    publisherId: 1,
  });
  await Series.createSeries({ name: "Series 2" });

  // Authors
  for (const id of [1, 2, 3, 4, 5]) {
    await Authors.createAuthor({
      name: `Author ${id}`,
      id,
    });
  }
});
afterAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});

describe("References: Create", () => {
  // Because the Photo Collection sub-type is the simplest of the three, I will
  // use this block of tests to exercise the logic around authors and tags in
  // terms of error-checking and auto-creation of new records.
  describe("Creation of Photo Collections", () => {
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

    test("Add photo collection reference, no authors", async () => {
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

    test("Add photo collection reference, new tags/authors", async () => {
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

    test("Add photo collection reference failure, missing collection data", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Photo Collection Reference 4",
          referenceTypeId: ReferenceTypes.PhotoCollection,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ name: "Author 1", id: 1 }, { id: 2 }],
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Reference must have photo collection data"
      );
    });

    test("Add photo collection reference failure, missing tags", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Photo Collection Reference 5",
          referenceTypeId: ReferenceTypes.PhotoCollection,
          tags: [],
          authors: [{ name: "Author 1", id: 1 }, { id: 2 }],
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Reference must have at least one tag"
      );
    });
  });

  // No longer have to worry about auto-creation of Authors and Tags. But for
  // magazine features it is necessary to test the creation of new magazines
  // and issues.
  describe("Creation of Magazine Features", () => {
    test("Add magazine feature reference", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 1",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();
    });

    test("Add magazine feature reference, no authors", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 2",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();
    });

    test("Add magazine feature reference, new issue", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 3",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssue: {
            issue: "6",
          },
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const clean = reference.clean();
      if (clean.magazineFeature) {
        const { magazineIssueId } = clean.magazineFeature;
        expect(magazineIssueId).toBeDefined();
        expect(magazineIssueId > 25).toBe(true);
        const issue = await MagazineIssues.getMagazineIssueById(
          magazineIssueId,
          {
            magazine: true,
          }
        );
        if (issue) {
          expect(issue.magazineId).toBe(1);
          expect(issue.issue).toBe("6");
        } else {
          assert.fail("New magazine issue not found");
        }
      } else {
        assert.fail("No magazine issue data found");
      }
    });

    test("Add magazine feature reference, new magazine & issue", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 4",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazine: {
            name: "New Magazine 1",
          },
          magazineIssue: {
            issue: "1",
          },
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const clean = reference.clean();
      if (clean.magazineFeature) {
        const { magazineIssueId } = clean.magazineFeature;
        expect(magazineIssueId).toBeDefined();
        expect(magazineIssueId > 25).toBe(true);
        const issue = await MagazineIssues.getMagazineIssueById(
          magazineIssueId,
          {
            magazine: true,
          }
        );
        if (issue) {
          expect(issue.magazineId > 5).toBe(true);
          expect(issue.issue).toBe("1");
        } else {
          assert.fail("New magazine issue not found");
        }
      } else {
        assert.fail("No magazine issue data found");
      }
    });

    test("Add magazine feature reference failure, missing feature data", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Magazine Feature Reference",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Reference must have magazine feature data"
      );
    });

    test("Add magazine feature reference failure, missing feature tags", async () => {
      async function failToCreate() {
        await References.createReference({
          name: "Magazine Feature Reference 1",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineId: 1,
            magazineIssueId: 1,
            featureTags: [],
          },
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "featureTags cannot be an empty array"
      );
    });
  });

  describe("Creation of Books", () => {
    test("Add book reference, no series or publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 1",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {},
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
    });

    test("Add book reference, series and publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 2",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { publisherId: 1, seriesId: 1 },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
    });

    test("Add book reference, series only with no publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 3",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { seriesId: 2 },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
    });

    // None of the above tests had to do any critical handling of the book data.
    // Now test things like series<->publisher linkage, creation, etc.

    test("Add book reference, series only with publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 4",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { seriesId: 1 },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.seriesId).toBe(1);
      expect(reference.book?.publisherId).toBe(1);
    });

    test("Add book reference, new publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 5",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { publisher: { name: "New Publisher 1" } },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.publisherId).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { publisherId } = cleaned.book || {};

        expect(cleaned).toEqual({
          id,
          name: "Book Reference 5",
          language: null,
          referenceTypeId: 1,
          createdAt,
          updatedAt,
          book: {
            referenceId: id,
            isbn: null,
            seriesNumber: null,
            publisherId,
            publisher: {
              id: publisherId,
              name: "New Publisher 1",
              notes: null,
            },
            seriesId: null,
            series: null,
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("Add book reference, new series with no publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 6",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { series: { name: "New Series 1" } },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.seriesId).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { seriesId } = cleaned.book || {};

        expect(cleaned).toEqual({
          id,
          name: "Book Reference 6",
          language: null,
          referenceTypeId: 1,
          createdAt,
          updatedAt,
          book: {
            referenceId: id,
            isbn: null,
            seriesNumber: null,
            publisherId: null,
            publisher: null,
            seriesId,
            series: {
              id: seriesId,
              name: "New Series 1",
              notes: null,
              publisherId: null,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("Add book reference, new series with existing publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 7",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { series: { name: "New Series 2", publisherId: 1 } },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.seriesId).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { seriesId } = cleaned.book || {};

        expect(cleaned).toEqual({
          id,
          name: "Book Reference 7",
          language: null,
          referenceTypeId: 1,
          createdAt,
          updatedAt,
          book: {
            referenceId: id,
            isbn: null,
            seriesNumber: null,
            publisherId: 1,
            publisher: {
              id: 1,
              name: "Publisher 1",
              notes: null,
            },
            seriesId,
            series: {
              id: seriesId,
              name: "New Series 2",
              notes: null,
              publisherId: 1,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("Add book reference, new series with book.publisherId", async () => {
      const reference = await References.createReference({
        name: "Book Reference 8",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: { publisherId: 1, series: { name: "New Series 3" } },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.seriesId).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { seriesId } = cleaned.book || {};

        expect(cleaned).toEqual({
          id,
          name: "Book Reference 8",
          language: null,
          referenceTypeId: 1,
          createdAt,
          updatedAt,
          book: {
            referenceId: id,
            isbn: null,
            seriesNumber: null,
            publisherId: 1,
            publisher: {
              id: 1,
              name: "Publisher 1",
              notes: null,
            },
            seriesId,
            series: {
              id: seriesId,
              name: "New Series 3",
              notes: null,
              publisherId: 1,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("Add book reference, new series and new publisher", async () => {
      const reference = await References.createReference({
        name: "Book Reference 9",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {
          publisher: { name: "New Publisher 3" },
          series: { name: "New Series 4" },
          seriesNumber: "1",
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
      expect(reference.book?.seriesId).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { publisherId, seriesId } = cleaned.book || {};

        expect(cleaned).toEqual({
          id,
          name: "Book Reference 9",
          language: null,
          referenceTypeId: 1,
          createdAt,
          updatedAt,
          book: {
            referenceId: id,
            isbn: null,
            seriesNumber: "1",
            publisherId,
            publisher: {
              id: publisherId,
              name: "New Publisher 3",
              notes: null,
            },
            seriesId,
            series: {
              id: seriesId,
              name: "New Series 4",
              notes: null,
              publisherId,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("Add book reference failure, missing book data", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 10",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Reference must have book data"
      );
    });

    test("Add book reference failure, mismatched publisher", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 11",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisherId: 1, seriesId: 2 },
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Series publisher doesn't match book-provided publisher"
      );
    });

    test("Add book reference failure, mismatched publisherId", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 12",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: {
            publisherId: 1,
            series: { name: "New Series 5", publisherId: 2 },
          },
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Series publisher doesn't match book publisher"
      );
    });

    test("Add book reference failure, missing new publisher name", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 13",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: {
            publisher: { notes: "New Publisher 5" },
          },
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Publisher name is required to create a new publisher"
      );
    });

    test("Add book reference failure, missing new series name", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 14",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: {
            series: { publisherId: 2 },
          },
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Series name is required to create a new series"
      );
    });
  });
});

describe("References: Retrieve", () => {
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

    await References.createReference({
      name: "Magazine Feature Reference 1",
      referenceTypeId: ReferenceTypes.MagazineFeature,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      magazineFeature: {
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      },
    });

    await References.createReference({
      name: "Magazine Feature Reference 2",
      referenceTypeId: ReferenceTypes.MagazineFeature,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      magazineFeature: {
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      },
    });

    await References.createReference({
      name: "Book Reference 1",
      referenceTypeId: ReferenceTypes.Book,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      book: {},
    });

    await References.createReference({
      name: "Book Reference 2",
      referenceTypeId: ReferenceTypes.Book,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      book: {},
    });
  });

  test("Get all references", async () => {
    const references = await References.getAllReferences();

    expect(references.length >= 6).toBe(true);
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
          name: "Photo Collection Reference 1",
          language: null,
          referenceTypeId: 3,
          createdAt,
          updatedAt,
          photoCollection: {
            referenceId: 1,
            location: "Location 1",
            media: "Media 1",
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

describe("References: Update", () => {
  describe("Update of Photo Collections", () => {
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

    test("Update collection, basic photo collection update", async () => {
      const reference = await References.updateReferenceById(
        photoCollectionId,
        {
          photoCollection: {
            location: "Updated Location",
            media: "Updated Media",
          },
        }
      );

      expect(reference).toBeDefined();
      expect(reference?.name).toBe("Photo Collection Reference");
      expect(reference?.photoCollection?.location).toBe("Updated Location");
      expect(reference?.photoCollection?.media).toBe("Updated Media");
    });

    // Testing the updating of authors and tags, and testing an empty update,
    // are things that only need to be done once. They won't be different for
    // the other reference types.

    test("Update collection, update authors and tags", async () => {
      const reference = await References.updateReferenceById(
        photoCollectionId,
        {
          authors: [{ id: 3 }, { id: 4 }],
          tags: [{ id: 3 }, { id: 4 }],
        }
      );

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

    test("Update collection, no changes", async () => {
      const reference = await References.getReferenceById(photoCollectionId);
      expect(reference).toBeDefined();
      const initialUpdatedAt = reference?.updatedAt;
      const updatedReference = await References.updateReferenceById(
        photoCollectionId,
        {}
      );
      expect(updatedReference?.updatedAt).toStrictEqual(initialUpdatedAt);
    });
  });

  describe("Update of Magazine Features", () => {
    // We know that basic updates of the core data are covered in the previous
    // test-group. We just need to test updates of the nested data.

    let magazineFeatureId: number;

    beforeEach(async () => {
      magazineFeatureId = (
        await References.createReference({
          name: "Magazine Feature Reference",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineId: 1,
            magazineIssueId: 1,
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        })
      ).id;
    });

    test("Update feature, issue ID & feature tags", async () => {
      const reference = await References.updateReferenceById(
        magazineFeatureId,
        {
          magazineFeature: {
            magazineIssueId: 2,
            featureTags: [{ id: 3 }, { id: 4 }],
          },
        }
      );

      if (reference) {
        expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(1);
        expect(reference.magazineFeature?.magazineIssue?.issue).toBe("2");
        if (reference.magazineFeature?.featureTags) {
          expect(reference.magazineFeature?.featureTags?.length).toBe(2);
          expect(reference.magazineFeature?.featureTags[0].id).toBe(3);
          expect(reference.magazineFeature?.featureTags[1].id).toBe(4);
        }
      }
    });

    test("Update feature, feature tags only", async () => {
      const reference = await References.updateReferenceById(
        magazineFeatureId,
        {
          magazineFeature: {
            featureTags: [{ id: 3 }, { id: 4 }],
          },
        }
      );

      expect(reference).toBeDefined();
      if (reference?.magazineFeature?.featureTags) {
        expect(reference?.magazineFeature?.featureTags?.length).toBe(2);
        expect(reference.magazineFeature.featureTags[0].id).toBe(3);
        expect(reference.magazineFeature.featureTags[1].id).toBe(4);
      } else {
        assert.fail("Updated feature tags not found");
      }
    });

    test("Update feature failure, empty feature tags", async () => {
      async function failToUpdate() {
        await References.updateReferenceById(magazineFeatureId, {
          magazineFeature: {
            featureTags: [],
          },
        });
      }

      expect(() => failToUpdate()).rejects.toThrowError(
        "featureTags cannot be empty"
      );
    });

    describe.skip("Combinations of magazine/issue updates", () => {
      // Try to test all the combinations of magazine and issue updates, where
      // each can be either a given ID or a new object. See the (large) comment
      // block in db/references.ts for more details.
    });
  });

  describe.skip("Update of Books", () => {
    // let bookId: number = 0;
    // beforeAll(async () => {
    //   const book = await References.createReference({
    //     name: "Book Reference 1",
    //     referenceTypeId: ReferenceTypes.Book,
    //     tags: [{ id: 1 }, { id: 2 }],
    //     authors: [{ id: 1 }, { id: 2 }],
    //     book: {
    //       isbn: "123456789",
    //       publisher: { name: "Publisher For Update" },
    //       series: { name: "Series For Update" },
    //     },
    //   });
    //   bookId = book.id;
    // });
  });

  describe.skip("Updates to Different Reference Types", () => {
    // Test the various paths of updates which change a reference's type.
  });
});

describe("References: Delete", () => {
  test("Delete reference", async () => {
    const reference = await References.createReference({
      name: "Photo Collection Reference 1",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      photoCollection: {
        location: "Location 1",
        media: "Media 1",
      },
    });
    const referenceId = reference.id;

    const deleted = await References.deleteReferenceById(referenceId);

    expect(deleted).toBe(1);

    const dataRecord = await PhotoCollection.findByPk(referenceId);
    expect(dataRecord).toBeNull();
  });
});
