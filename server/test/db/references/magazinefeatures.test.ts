/**
 * Test suite for the database code in the `db/references.ts` module.
 *
 * This suite covers the `MagazineFeature` type of reference.
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
import { Authors, Magazines, MagazineIssues, References } from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../../src/constants";
import { Magazine, MagazineFeature, Reference } from "models";

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

  // Authors
  for (const id of [1, 2, 3, 4, 5]) {
    await Authors.createAuthor({
      name: `Author ${id}`,
      id,
    });
  }

  // Create a single baseline magazine feature for testing an empty update
  // later on.
  await References.createReference({
    name: "Baseline Magazine Feature Reference 1",
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
  await tearDownTestDatabase();
});

describe("References: Magazine Features: Create", () => {
  // Because the Photo Collection sub-type is the simplest of the three, the
  // testing of things like author and tag auto-creation will be done in that
  // suite.

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
      const issue = await MagazineIssues.getMagazineIssueById(magazineIssueId, {
        magazine: true,
      });
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
      const issue = await MagazineIssues.getMagazineIssueById(magazineIssueId, {
        magazine: true,
      });
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

  test("Add magazine feature reference, missing feature data", async () => {
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

  test("Add magazine feature reference, missing feature tags", async () => {
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

describe("References: Magazine Features: Retrieve", () => {
  // Create a handful of references for the tests to operate on
  beforeAll(async () => {
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
      const { createdAt, updatedAt, magazineFeature, authors } = cleaned;

      const magazineIssueDates: string[] = [];
      if (magazineFeature) {
        expect(magazineFeature).toBeDefined();
        const { magazineIssueId } = magazineFeature;
        const issue =
          await MagazineIssues.getMagazineIssueById(magazineIssueId);
        if (issue) {
          magazineIssueDates.push(
            issue.createdAt.toISOString(),
            issue.updatedAt.toISOString()
          );
        } else {
          assert.fail(`Magazine issue (${magazineIssueId}) not found`);
        }
      } else {
        assert.fail("No magazine feature data found");
      }

      if (authors && authors.length === 2) {
        const createdVals = authors.map((author) => author.createdAt);
        const updatedVals = authors.map((author) => author.updatedAt);

        expect(cleaned).toEqual({
          id: 1,
          name: "Baseline Magazine Feature Reference 1",
          language: null,
          referenceTypeId: ReferenceTypes.MagazineFeature,
          createdAt: createdAt,
          updatedAt: updatedAt,
          magazineFeature: {
            referenceId: 1,
            magazineIssueId: 1,
            magazineIssue: {
              id: 1,
              issue: "1",
              magazineId: 1,
              createdAt: magazineIssueDates[0],
              updatedAt: magazineIssueDates[1],
            },
            featureTags: [
              {
                id: 1,
                name: "color illustrations",
                description: "Subject illustrations (in color)",
              },
              {
                id: 2,
                name: "color plates",
                description: "Color plates",
              },
            ],
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

describe("References: Magazine Features: Update", () => {
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
    const reference = await References.updateReferenceById(magazineFeatureId, {
      magazineFeature: {
        magazineIssueId: 2,
        featureTags: [{ id: 3 }, { id: 4 }],
      },
    });

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
    const reference = await References.updateReferenceById(magazineFeatureId, {
      magazineFeature: {
        featureTags: [{ id: 3 }, { id: 4 }],
      },
    });

    expect(reference).toBeDefined();
    if (reference?.magazineFeature?.featureTags) {
      expect(reference?.magazineFeature?.featureTags?.length).toBe(2);
      expect(reference.magazineFeature.featureTags[0].id).toBe(3);
      expect(reference.magazineFeature.featureTags[1].id).toBe(4);
    } else {
      assert.fail("Updated feature tags not found");
    }
  });

  test("Update feature, empty feature tags", async () => {
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
    test("Update feature, magazine ID only", async () => {
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
    test("Update feature, magazine ID & issue ID", async () => {
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
        expect(reference.magazineFeature?.magazineIssue?.issue).toBe("4 test");
        expect(reference.magazineFeature?.magazineIssue?.magazineId).toBe(1);
      }
    });

    // 5. `magazine` and `magazineIssueId`: Should be an error.
    test("Update feature, magazine data & issue ID", async () => {
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
    test("Update feature, magazine data & no issue data", async () => {
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
        expect(reference.magazineFeature?.magazineIssue?.issue).toBe("8 test");
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

describe("References: Magazine Features: Delete", () => {
  test("Delete reference", async () => {
    const deleted = await References.deleteReferenceById(1);

    expect(deleted).toBe(1);

    const dataRecord = await MagazineFeature.findByPk(1);
    expect(dataRecord).toBeNull();
  });
});
