/**
 * Test suite for the database code in the `db/references.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
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

beforeAll(async () => {
  await setupTestDatabase();

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
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Updates Between Different Reference Types", () => {
  // Test the various paths of updates which change a reference's type.

  describe("From Book", () => {
    test("To Magazine Feature", async () => {
      const reference = await References.createReference({
        name: "Book Reference to Magazine Feature",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {
          isbn: "ISBN 1",
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.MagazineFeature,
        magazineFeature: {
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        magazineFeature: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.magazineFeature) {
          expect(updatedReference.magazineFeature.magazineIssueId).toBe(1);
          expect(updatedReference.magazineFeature.featureTags.length).toBe(2);
          expect(updatedReference.magazineFeature.featureTags[0].id).toBe(1);
          expect(updatedReference.magazineFeature.featureTags[1].id).toBe(2);
        }
      }
    });

    test("To Photo Collection", async () => {
      const reference = await References.createReference({
        name: "Book Reference to Photo Collection",
        referenceTypeId: ReferenceTypes.Book,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        book: {
          isbn: "ISBN 1",
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.PhotoCollection,
        photoCollection: {
          location: "Location",
          media: "Media",
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        photoCollection: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.photoCollection) {
          expect(updatedReference.photoCollection.location).toBe("Location");
          expect(updatedReference.photoCollection.media).toBe("Media");
        } else {
          assert.fail("No photo collection found");
        }
      } else {
        assert.fail("No updated reference found");
      }
    });
  });

  describe("From Magazine Feature", () => {
    test("To Book", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference to Book",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.Book,
        book: {
          isbn: "ISBN 1",
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        book: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.book) {
          expect(updatedReference.book.isbn).toBe("ISBN 1");
        } else {
          assert.fail("No book found");
        }
      }
    });

    test("To Photo Collection", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference to Photo Collection",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.PhotoCollection,
        photoCollection: {
          location: "Location",
          media: "Media",
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        photoCollection: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.photoCollection) {
          expect(updatedReference.photoCollection.location).toBe("Location");
          expect(updatedReference.photoCollection.media).toBe("Media");
        } else {
          assert.fail("No photo collection found");
        }
      }
    });
  });

  describe("From Photo Collection", () => {
    test("To Book", async () => {
      const reference = await References.createReference({
        name: "Photo Collection Reference to Book",
        referenceTypeId: ReferenceTypes.PhotoCollection,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        photoCollection: {
          location: "Location",
          media: "Media",
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.Book,
        book: {
          isbn: "ISBN 1",
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        book: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.book) {
          expect(updatedReference.book.isbn).toBe("ISBN 1");
        } else {
          assert.fail("No book found");
        }
      }
    });

    test("To Magazine Feature", async () => {
      const reference = await References.createReference({
        name: "Photo Collection Reference to Magazine Feature",
        referenceTypeId: ReferenceTypes.PhotoCollection,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        photoCollection: {
          location: "Location",
          media: "Media",
        },
      });

      await References.updateReferenceById(reference.id, {
        referenceTypeId: ReferenceTypes.MagazineFeature,
        magazineFeature: {
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      const updatedReference = await References.getReferenceById(reference.id, {
        tags: true,
        authors: true,
        magazineFeature: true,
      });
      if (updatedReference) {
        if (updatedReference.tags) {
          expect(updatedReference.tags.length).toBe(2);
          expect(updatedReference.tags[0].id).toBe(1);
          expect(updatedReference.tags[1].id).toBe(2);
        } else {
          assert.fail("No tags found");
        }
        if (updatedReference.authors) {
          expect(updatedReference.authors.length).toBe(2);
          expect(updatedReference.authors[0].id).toBe(1);
          expect(updatedReference.authors[1].id).toBe(2);
        } else {
          assert.fail("No authors found");
        }
        if (updatedReference.magazineFeature) {
          expect(updatedReference.magazineFeature.magazineIssueId).toBe(1);
          expect(updatedReference.magazineFeature.featureTags.length).toBe(2);
          expect(updatedReference.magazineFeature.featureTags[0].id).toBe(1);
          expect(updatedReference.magazineFeature.featureTags[1].id).toBe(2);
        } else {
          assert.fail("No magazine feature found");
        }
      }
    });
  });
});
