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
  Series as SeriesDB,
} from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";
import { Magazine, PhotoCollection, Reference } from "models";

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
  await SeriesDB.createSeries({
    name: "Series 1",
    publisherId: 1,
  });
  await SeriesDB.createSeries({ name: "Series 2" });

  // Authors
  for (const id of [1, 2, 3, 4, 5]) {
    await Authors.createAuthor({
      name: `Author ${id}`,
      id,
    });
  }

  // Create a single baseline book for testing an empty update later on.
  await References.createReference({
    name: "Book Reference 1",
    referenceTypeId: ReferenceTypes.Book,
    tags: [{ id: 1 }, { id: 2 }],
    authors: [{ id: 1 }, { id: 2 }],
    book: {
      isbn: "ISBN 1",
    },
  });
  // Same for a magazine feature.
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
    test("Add book reference failure, missing book data", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference missing data",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
        });
      }

      expect(() => failToCreate()).rejects.toThrowError(
        "Reference must have book data"
      );
    });

    test("Add book reference, minimal data (case 0)", async () => {
      const reference = await References.createReference({
        name: "Book Reference 0",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {},
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
      expect(reference.book).toBeDefined();
    });

    describe("Combinations of publisher/series specification", () => {
      test("Add book reference, publisherId only (case 1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 1",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisherId: 1 },
        });

        expect(reference).toBeDefined();
        expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
        expect(reference.book).toBeDefined();
        expect(reference.book?.publisherId).toBe(1);
      });

      test("Add book reference, seriesId only (case 2.1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 2.1",
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

      test("Add book reference, seriesId only (case 2.2)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 2.2",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { seriesId: 2 },
        });

        expect(reference).toBeDefined();
        expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
        expect(reference.book).toBeDefined();
        expect(reference.book?.seriesId).toBe(2);
        expect(reference.book?.publisherId).toBeNull();
      });

      test("Add book reference, seriesId and publisherId (case 3.1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 3.1",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisherId: 1, seriesId: 1 },
        });

        expect(reference).toBeDefined();
        expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
        expect(reference.book).toBeDefined();
        expect(reference.book?.seriesId).toBe(1);
        expect(reference.book?.publisherId).toBe(1);
      });

      test("Add book reference, seriesId and publisherId (case 3.2)", async () => {
        async function failToCreate() {
          return await References.createReference({
            name: "Book Reference 3.2",
            referenceTypeId: ReferenceTypes.Book,
            tags: [{ id: 1 }, { id: 2 }],
            authors: [{ id: 1 }, { id: 2 }],
            book: { publisherId: 1, seriesId: 2 },
          });
        }

        expect(() => failToCreate()).rejects.toThrowError(
          "Series and publisher do not match"
        );
      });

      test("Add book reference, new series with publisherId (case 4.1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 4.1",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { series: { name: "New Series 4.1" }, publisherId: 1 },
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
            name: "Book Reference 4.1",
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
                name: "New Series 4.1",
                notes: null,
                publisherId: 1,
              },
            },
          });
        } else {
          assert.fail("New reference not found");
        }
      });

      test("Add book reference, new series with publisherId (case 4.2)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 4.2",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: {
            series: { name: "New Series 4.2", publisherId: 2 },
            publisherId: 1,
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
          const { seriesId } = cleaned.book || {};

          expect(cleaned).toEqual({
            id,
            name: "Book Reference 4.2",
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
                name: "New Series 4.2",
                notes: null,
                publisherId: 1,
              },
            },
          });
        } else {
          assert.fail("New reference not found");
        }
      });

      test("Add book reference, new series missing name (case 4.3)", async () => {
        async function failToCreate() {
          return await References.createReference({
            name: "Book Reference 4.3",
            referenceTypeId: ReferenceTypes.Book,
            tags: [{ id: 1 }, { id: 2 }],
            authors: [{ id: 1 }, { id: 2 }],
            book: { series: { publisherId: 2 } },
          });
        }

        expect(() => failToCreate()).rejects.toThrowError(
          "Missing series name"
        );
      });

      test("Add book reference, new publisher and seriesId (case 5)", async () => {
        async function failToCreate() {
          return await References.createReference({
            name: "Book Reference 5",
            referenceTypeId: ReferenceTypes.Book,
            tags: [{ id: 1 }, { id: 2 }],
            authors: [{ id: 1 }, { id: 2 }],
            book: { publisher: { name: "New Publisher 5" }, seriesId: 2 },
          });
        }

        expect(() => failToCreate()).rejects.toThrowError(
          "Cannot specify `seriesId` with new `publisher` data"
        );
      });

      test("Add book reference, new publisher no series (case 6.1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 6.1",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisher: { name: "New Publisher 6.1" } },
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
            name: "Book Reference 6.1",
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
                name: "New Publisher 6.1",
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

      test("Add book reference, new publisher missing name (case 6.2)", async () => {
        async function failToCreate() {
          return await References.createReference({
            name: "Book Reference 6.2",
            referenceTypeId: ReferenceTypes.Book,
            tags: [{ id: 1 }, { id: 2 }],
            authors: [{ id: 1 }, { id: 2 }],
            book: {
              publisher: { notes: "New Publisher 6.2" },
            },
          });
        }

        expect(() => failToCreate()).rejects.toThrowError(
          "Missing publisher name"
        );
      });

      test("Add book reference, new series no publisher (case 7.1)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 7.1",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { series: { name: "New Series 7.1" } },
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
            name: "Book Reference 7.1",
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
                name: "New Series 7.1",
                notes: null,
                publisherId: null,
              },
            },
          });
        } else {
          assert.fail("New reference not found");
        }
      });

      test("Add book reference, new series no publisher (case 7.2)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 7.2",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { series: { name: "New Series 7.2", publisherId: 1 } },
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
            name: "Book Reference 7.2",
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
                name: "New Series 7.2",
                notes: null,
                publisherId: 1,
              },
            },
          });
        } else {
          assert.fail("New reference not found");
        }
      });

      test("Add book reference failure, new series missing name (7.3)", async () => {
        async function failToCreate() {
          return await References.createReference({
            name: "Book Reference 7.3",
            referenceTypeId: ReferenceTypes.Book,
            tags: [{ id: 1 }, { id: 2 }],
            authors: [{ id: 1 }, { id: 2 }],
            book: {
              series: { publisherId: 2 },
            },
          });
        }

        expect(() => failToCreate()).rejects.toThrowError(
          "Missing series name"
        );
      });

      test("Add book reference, new series and new publisher (case 8)", async () => {
        const reference = await References.createReference({
          name: "Book Reference 8",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: {
            publisher: { name: "New Publisher 8" },
            series: { name: "New Series 8" },
            seriesNumber: "8",
          },
        });

        expect(reference).toBeDefined();
        expect(reference.referenceTypeId).toBe(ReferenceTypes.Book);
        expect(reference.book).toBeDefined();
        expect(reference.book?.seriesId).toBeDefined();
        expect(reference.book?.publisherId).toBeDefined();

        const newReference = await References.getReferenceById(reference.id);
        if (newReference) {
          const cleaned = newReference.clean();
          const { id, createdAt, updatedAt } = cleaned;
          const { publisherId, seriesId } = cleaned.book || {};

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
              seriesNumber: "8",
              publisherId,
              publisher: {
                id: publisherId,
                name: "New Publisher 8",
                notes: null,
              },
              seriesId,
              series: {
                id: seriesId,
                name: "New Series 8",
                notes: null,
                publisherId,
              },
            },
          });
        } else {
          assert.fail("New reference not found");
        }
      });
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

    expect(references.length >= 8).toBe(true);
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
          name: "Book Reference 1",
          language: null,
          referenceTypeId: 1,
          createdAt: createdAt,
          updatedAt: updatedAt,
          book: {
            referenceId: 1,
            isbn: "ISBN 1",
            seriesNumber: null,
            publisherId: null,
            seriesId: null,
            publisher: null,
            series: null,
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

    describe("Combinations of magazine/issue updates", () => {
      // Try to test all the combinations of magazine and issue updates, where
      // each can be either a given ID or a new object. See the (large) comment
      // block in db/references.ts (`fixupMagazineFeatureForUpdate`) for more
      // details.

      // 1. `magazineId` only: Should be an error.
      test("Update feature failure, magazine ID only", async () => {
        async function failToUpdate() {
          await References.updateReferenceById(magazineFeatureId, {
            magazineFeature: {
              magazineId: 2,
            },
          });
        }

        expect(() => failToUpdate()).rejects.toThrowError(
          "magazineId without magazineIssue data is not allowed"
        );
      });

      // 2. `magazineIssueId` only: Should work as intended.
      test("Update feature, issue ID only", async () => {
        const reference = await References.updateReferenceById(
          magazineFeatureId,
          {
            magazineFeature: {
              magazineIssueId: 6,
            },
          }
        );

        expect(reference).toBeDefined();
        if (reference) {
          expect(reference.magazineFeature?.magazineIssue?.issue).toBe("1");
          expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(2);
        }
      });

      // 3. `magazineId` and `magazineIssueId`: Should be an error.
      test("Update feature failure, magazine ID & issue ID", async () => {
        async function failToUpdate() {
          await References.updateReferenceById(magazineFeatureId, {
            magazineFeature: {
              magazineId: 1,
              magazineIssueId: 6,
            },
          });
        }

        expect(() => failToUpdate()).rejects.toThrowError(
          "magazineId and magazineIssueId cannot both be provided"
        );
      });

      // 4. `magazineId` and `magazineIssue`: Should work as intended.
      test("Update feature, magazine ID & issue data", async () => {
        const reference = await References.updateReferenceById(
          magazineFeatureId,
          {
            magazineFeature: {
              magazineId: 1,
              magazineIssue: {
                issue: "4 test",
              },
            },
          }
        );

        expect(reference).toBeDefined();
        if (reference) {
          expect(reference.magazineFeature?.magazineIssue?.issue).toBe(
            "4 test"
          );
          expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(1);
        }
      });

      // 5. `magazine` and `magazineIssueId`: Should be an error.
      test("Update feature failure, magazine data & issue ID", async () => {
        async function failToUpdate() {
          await References.updateReferenceById(magazineFeatureId, {
            magazineFeature: {
              magazine: {
                name: "Test",
              },
              magazineIssueId: 6,
            },
          });
        }

        expect(() => failToUpdate()).rejects.toThrowError(
          "magazineIssueId cannot be provided with magazine data"
        );
      });

      // 6. `magazine` and no `magazineIssue`: Should be an error.
      test("Update feature failure, magazine data & no issue data", async () => {
        async function failToUpdate() {
          await References.updateReferenceById(magazineFeatureId, {
            magazineFeature: {
              magazine: {
                name: "Test",
              },
            },
          });
        }

        expect(() => failToUpdate()).rejects.toThrowError(
          "magazine data without magazineIssue data is not allowed"
        );
      });

      // 7. `magazineIssue` and no `magazine`: Should work as intended.
      test("Update feature, issue data & no magazine data (1)", async () => {
        const reference = await References.updateReferenceById(
          magazineFeatureId,
          {
            magazineFeature: {
              magazineIssue: {
                issue: "7.1 test",
              },
            },
          }
        );

        expect(reference).toBeDefined();
        if (reference) {
          expect(reference.magazineFeature?.magazineIssue?.issue).toBe(
            "7.1 test"
          );
          expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(1);
        }
      });

      test("Update feature, issue data & no magazine data (2)", async () => {
        const reference = await References.updateReferenceById(
          magazineFeatureId,
          {
            magazineFeature: {
              magazineIssue: {
                issue: "7.2 test",
                magazineId: 2,
              },
            },
          }
        );

        expect(reference).toBeDefined();
        if (reference) {
          expect(reference.magazineFeature?.magazineIssue?.issue).toBe(
            "7.2 test"
          );
          expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(2);
        }
      });

      // 8. `magazineIssue` and `magazine`: Should work as intended.
      test("Update feature, issue data & magazine data", async () => {
        const reference = await References.updateReferenceById(
          magazineFeatureId,
          {
            magazineFeature: {
              magazine: {
                name: "Test 8",
              },
              magazineIssue: {
                issue: "8 test",
              },
            },
          }
        );

        expect(reference).toBeDefined();
        if (reference) {
          const magazine = await Magazine.findOne({
            where: { name: "Test 8" },
          });
          expect(reference.magazineFeature?.magazineIssue?.issue).toBe(
            "8 test"
          );
          expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(
            magazine?.id
          );
        }
      });
      // 9. Nothing is provided: No update should happen.
      test("Update feature, no data provided", async () => {
        const baselineFeature = await Reference.findOne({
          where: { name: "Magazine Feature Reference 1" },
        });

        if (baselineFeature) {
          const oldUpdatedAt = baselineFeature.updatedAt;

          const reference = await References.updateReferenceById(
            baselineFeature.id,
            {
              magazineFeature: {},
            }
          );

          expect(reference).toBeDefined();
          expect(reference?.updatedAt).toStrictEqual(oldUpdatedAt);
        } else {
          throw new Error("Baseline magazine feature not found");
        }
      });
    });
  });

  describe("Update of Books", () => {
    let bookIdx: number = 0;
    let bookId: number = 0;
    let baselineBook: Reference;

    beforeEach(async () => {
      // Create a baseline book reference for each test. Use `bookIdx` to keep
      // track of which reference we are creating.
      bookIdx++;

      baselineBook = await References.createReference({
        name: `Baseline Book Reference ${bookIdx}`,
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {
          isbn: "123456789",
          seriesNumber: `Test ${bookIdx}`,
          publisher: { name: `Baseline Publisher ${bookIdx}` },
          series: { name: `Baseline Series ${bookIdx}` },
        },
      });
      bookId = baselineBook.id;
    });

    describe("Combinations of publisher/series updates", () => {
      test("Update book, changing series changes publisher", async () => {
        const reference = await References.updateReferenceById(bookId, {
          book: {
            seriesId: 1,
          },
        });

        expect(reference).toBeDefined();
        console.log(reference?.clean());
        if (reference) {
          expect(reference.book?.publisherId).toBe(1);
          expect(reference.book?.seriesId).toBe(1);
        }
      });

      test("Update book failure, changing publisher without series", async () => {
        async function failToUpdate() {
          await References.updateReferenceById(bookId, {
            book: {
              publisherId: 1,
            },
          });
        }

        expect(() => failToUpdate()).rejects.toThrowError(
          "Cannot change publisher when series is already set"
        );
      });
    });
  });

  describe.skip("Updates Between Different Reference Types", () => {
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
