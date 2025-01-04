/**
 * Test suite for the database code in the `db/references.ts` module.
 *
 * This suite covers the `Book` type of reference.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../../database";
import { Authors, Publishers, References, Series as SeriesDB } from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../../src/constants";
import { Book, Reference } from "models";
import { BookForReference } from "types/book";

beforeAll(async () => {
  await setupTestDatabase();

  // Create some baseline data here, before tests run. This way, if only a
  // single test runs it will still have basic data on hand.

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
    name: "Baseline Book Reference 1",
    referenceTypeId: ReferenceTypes.Book,
    tags: [{ id: 1 }, { id: 2 }],
    authors: [{ id: 1 }, { id: 2 }],
    book: {
      isbn: "ISBN 1",
    },
  });
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("References: Books: Create", () => {
  // Because the Photo Collection sub-type is the simplest of the three, the
  // testing of things like author and tag auto-creation will be done in that
  // suite.

  test("Add book reference, missing book data", async () => {
    async function failToCreate() {
      return await References.createReference({
        name: "Book Reference missing data",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError(
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
    test("publisherId only (case 1)", async () => {
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

    test("seriesId only (case 2.1)", async () => {
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

    test("seriesId only (case 2.2)", async () => {
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

    test("seriesId and publisherId (case 3.1)", async () => {
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

    test("seriesId and publisherId (case 3.2)", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 3.2",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisherId: 1, seriesId: 2 },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "Series and publisher do not match"
      );
    });

    test("New series with publisherId (case 4.1)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

    test("New series with publisherId (case 4.2)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

    test("New series missing name (case 4.3)", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 4.3",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { series: { publisherId: 2 } },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "Missing new series name"
      );
    });

    test("New publisher and seriesId (case 5)", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Book Reference 5",
          referenceTypeId: ReferenceTypes.Book,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          book: { publisher: { name: "New Publisher 5" }, seriesId: 2 },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "Cannot specify `seriesId` with new `publisher` data"
      );
    });

    test("New publisher with no series (case 6.1)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

    test("New publisher missing name (case 6.2)", async () => {
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

      await expect(() => failToCreate()).rejects.toThrowError(
        "Missing new publisher name"
      );
    });

    test("New series no publisher (case 7.1)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

    test("New series no publisher (case 7.2)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

    test("New series missing name (7.3)", async () => {
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

      await expect(() => failToCreate()).rejects.toThrowError(
        "Missing new series name"
      );
    });

    test("New series and new publisher (case 8)", async () => {
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
          referenceTypeId: ReferenceTypes.Book,
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

describe("References: Books: Retrieve", () => {
  // Create a handful of references for the tests to operate on
  beforeAll(async () => {
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
          name: "Baseline Book Reference 1",
          language: null,
          referenceTypeId: ReferenceTypes.Book,
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

describe("References: Books: Update", () => {
  let bookIdx: number = 0;

  async function createBookReference(
    book: BookForReference
  ): Promise<[number, Reference]> {
    bookIdx++;
    const bookReference = await References.createReference({
      name: `Book Reference ${bookIdx}`,
      referenceTypeId: ReferenceTypes.Book,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      book,
    });

    return [bookReference.id, bookReference];
  }

  test("Update book, change nothing (case 0.1)", async () => {
    const [bookId] = await createBookReference({
      isbn: "123456789",
      seriesNumber: `Test ${bookIdx}`,
      publisher: { name: `Baseline Publisher ${bookIdx}` },
      series: { name: `Baseline Series ${bookIdx}` },
    });
    const reference = await References.updateReferenceById(bookId, {});

    expect(reference).toBeDefined();
    if (reference) {
      expect(reference.book?.isbn).toBe("123456789");
    }
  });

  test("Update book, change ISBN but nothing else (case 0.2)", async () => {
    const [bookId] = await createBookReference({
      isbn: "123456789",
      seriesNumber: `Test ${bookIdx}`,
      publisher: { name: `Baseline Publisher ${bookIdx}` },
      series: { name: `Baseline Series ${bookIdx}` },
    });
    const reference = await References.updateReferenceById(bookId, {
      book: {
        isbn: "987654321",
      },
    });

    expect(reference).toBeDefined();
    if (reference) {
      expect(reference.book?.isbn).toBe("987654321");
    }
  });

  describe("Combinations of publisher/series updates", () => {
    test("publisherId, no series or info (case 1.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisherId: 1,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisherId).toBe(1);
        expect(reference.book?.seriesId).toBeNull();
      }
    });

    test("publisherId with existing series (case 1.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            publisherId: 1,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Publisher and existing series do not match"
      );
    });

    test("publisherId with existing series (case 1.3)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisherId: 1,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisherId).toBe(1);
        if (reference.book?.series) {
          expect(reference.book.series.publisherId).toBe(1);
        } else {
          assert.fail("No series found");
        }
      }
    });

    test("publisherId matches series (case 1.4)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisherId: 1,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisherId: 1,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisherId).toBe(1);
        if (reference.book?.series) {
          expect(reference.book.series.publisherId).toBe(1);
        } else {
          assert.fail("No series found");
        }
      }
    });

    test("seriesId, no publisher or info (case 2.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          seriesId: 1,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.seriesId).toBe(1);
        expect(reference.book?.publisherId).toBe(1);
      }
    });

    test("seriesId, no publisher or info (case 2.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          seriesId: 2,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.seriesId).toBe(2);
        expect(reference.book?.publisherId).toBeNull();
      }
    });

    test("seriesId with existing publisher (case 2.3)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            seriesId: 1,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Series and publisher IDs do not match"
      );
    });

    test("publisherId and seriesId (case 3.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisherId: 1,
          seriesId: 1,
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisherId).toBe(1);
        expect(reference.book?.seriesId).toBe(1);
      }
    });

    test("publisherId and seriesId mismatch (case 3.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            publisherId: 1,
            seriesId: 2,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Series and publisher IDs do not match"
      );
    });

    test("publisherId and series data (case 4.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisherId: 1,
          series: { name: `Updated Series ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisherId).toBe(1);
        if (reference.book?.series) {
          expect(reference.book.series.name).toBe(`Updated Series ${bookIdx}`);
        } else {
          assert.fail("No series found");
        }
      }
    });

    test("publisherId and bad series data (case 4.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            publisherId: 1,
            series: {},
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Missing new series name"
      );
    });

    test("seriesId and publisher data (case 5)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            publisher: { name: `Updated Publisher ${bookIdx}` },
            seriesId: 1,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Cannot specify `seriesId` with new `publisher` data"
      );
    });

    test("publisher data, no series info, conflict (case 6.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      async function failToUpdate() {
        await References.updateReferenceById(bookId, {
          book: {
            publisher: { name: `Updated Publisher ${bookIdx}` },
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "Existing series is already associated with a publisher"
      );
    });

    test("publisher data, no series info (case 6.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisher: { name: `Updated Publisher ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisher.name).toBe(
          `Updated Publisher ${bookIdx}`
        );
        expect(reference.book?.series.publisherId).toBe(
          reference.book?.publisher.id
        );
      }
    });

    test("publisher data, no prior data (case 6.3)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisher: { name: `Updated Publisher ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.publisher.name).toBe(
          `Updated Publisher ${bookIdx}`
        );
        expect(reference.book?.series).toBeNull();
      }
    });

    test("series data, no publisher info (case 7.1)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          series: { name: `Updated Series ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.series.name).toBe(`Updated Series ${bookIdx}`);
        expect(reference.book?.publisher).toBeNull();
      }
    });

    test("series data, publisherId, no publisher info (case 7.2)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          series: { name: `Updated Series ${bookIdx}`, publisherId: 1 },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.series.name).toBe(`Updated Series ${bookIdx}`);
        expect(reference.book?.publisher.id).toBe(1);
      }
    });

    test("series data, existing publisher (case 7.3)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisherId: 1,
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          series: { name: `Updated Series ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.series.name).toBe(`Updated Series ${bookIdx}`);
        expect(reference.book?.series.publisherId).toBe(1);
      }
    });

    test("series data and publisher data (case 8)", async () => {
      const [bookId] = await createBookReference({
        isbn: "123456789",
        seriesNumber: `Test ${bookIdx}`,
        publisher: { name: `Baseline Publisher ${bookIdx}` },
        series: { name: `Baseline Series ${bookIdx}` },
      });
      const reference = await References.updateReferenceById(bookId, {
        book: {
          publisher: { name: `Updated Publisher ${bookIdx}` },
          series: { name: `Updated Series ${bookIdx}` },
        },
      });

      expect(reference).toBeDefined();
      if (reference) {
        expect(reference.book?.series.name).toBe(`Updated Series ${bookIdx}`);
        expect(reference.book?.publisher.name).toBe(
          `Updated Publisher ${bookIdx}`
        );
      }
    });
  });
});

describe("References: Books: Delete", () => {
  test("Delete book reference", async () => {
    const deleted = await References.deleteReferenceById(1);

    expect(deleted).toBe(1);

    const dataRecord = await Book.findByPk(1);
    expect(dataRecord).toBeNull();
  });
});
