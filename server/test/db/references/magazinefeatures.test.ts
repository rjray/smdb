/**
 * Test suite for the database code in the `db/references.ts` module.
 *
 * This suite covers the `MagazineFeature` type of reference.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../../database";
import { Authors, Magazines, MagazineIssues, References } from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../../src/constants";
import { Magazine, MagazineFeature, Reference } from "models";
import { MagazineFeatureForNewReference } from "types/magazinefeature";

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

  // Create a single baseline magazine feature for testing.
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

  test("Add magazine feature reference, missing magazine feature data", async () => {
    async function failToCreate() {
      return await References.createReference({
        name: "Magazine Feature Reference Fail (1)",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError(
      "Reference must have magazine feature data"
    );
  });

  test("Add magazine feature reference, missing feature tags", async () => {
    async function failToCreate() {
      await References.createReference({
        name: "Magazine Feature Reference Fail (2)",
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

    await expect(() => failToCreate()).rejects.toThrowError(
      "featureTags cannot be an empty array"
    );
  });

  test("Add magazine feature reference, empty data (case 0)", async () => {
    async function failToCreate() {
      return await References.createReference({
        name: "Magazine Feature Reference 0",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError(
      "magazineIssueId is required"
    );
  });

  describe("Combinations of magazine/issue specification", () => {
    test("magazineId only, no issue information (case 1)", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Magazine Feature Reference 1",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineId: 1,
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "magazineId by itself is not allowed"
      );
    });

    test("magazineIssueId only, no magazine information (case 2)", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 2",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { createdAt: magazineCreatedAt, updatedAt: magazineUpdatedAt } =
          cleaned.magazineFeature?.magazineIssue ?? {};

        expect(cleaned).toEqual({
          id,
          createdAt,
          updatedAt,
          name: "Magazine Feature Reference 2",
          language: null,
          referenceTypeId: ReferenceTypes.MagazineFeature,
          magazineFeature: {
            magazineIssueId: 1,
            referenceId: 2,
            featureTags: [
              {
                id: 1,
                description: "Subject illustrations (in color)",
                name: "color illustrations",
              },
              {
                id: 2,
                description: "Color plates",
                name: "color plates",
              },
            ],
            magazineIssue: {
              createdAt: magazineCreatedAt,
              id: 1,
              issue: "1",
              magazineId: 1,
              updatedAt: magazineUpdatedAt,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("magazineId and magazineIssueId (case 3.1)", async () => {
      async function failToCreate() {
        return await References.createReference({
          name: "Magazine Feature Reference 3.1",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineId: 2,
            magazineIssueId: 1,
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "magazineId conflicts with magazineIssueId"
      );
    });

    test("magazineId and magazineIssueId (case 3.2)", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 3.2",
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

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { createdAt: issueCreatedAt, updatedAt: issueUpdatedAt } =
          cleaned.magazineFeature?.magazineIssue ?? {};

        expect(cleaned).toEqual({
          id,
          createdAt,
          updatedAt,
          language: null,
          name: "Magazine Feature Reference 3.2",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          magazineFeature: {
            magazineIssueId: 1,
            referenceId: id,
            featureTags: [
              {
                id: 1,
                description: "Subject illustrations (in color)",
                name: "color illustrations",
              },
              { id: 2, description: "Color plates", name: "color plates" },
            ],
            magazineIssue: {
              id: 1,
              issue: "1",
              magazineId: 1,
              createdAt: issueCreatedAt,
              updatedAt: issueUpdatedAt,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("magazineId and magazineIssue data (case 4)", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 4",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineId: 1,
          magazineIssue: {
            issue: "10",
          },
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { magazineIssueId } = reference.magazineFeature ?? {};
        const { createdAt: issueCreatedAt, updatedAt: issueUpdatedAt } =
          cleaned.magazineFeature?.magazineIssue ?? {};

        expect(cleaned).toEqual({
          id,
          createdAt,
          updatedAt,
          name: "Magazine Feature Reference 4",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          language: null,
          magazineFeature: {
            magazineIssueId,
            referenceId: id,
            featureTags: [
              {
                id: 1,
                description: "Subject illustrations (in color)",
                name: "color illustrations",
              },
              { id: 2, description: "Color plates", name: "color plates" },
            ],
            magazineIssue: {
              id: magazineIssueId,
              issue: "10",
              magazineId: 1,
              createdAt: issueCreatedAt,
              updatedAt: issueUpdatedAt,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("magazine data and magazineIssueId (case 5)", async () => {
      function failToCreate() {
        return References.createReference({
          name: "Magazine Feature Reference 5",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineIssueId: 1,
            magazine: {
              name: "Magazine Fail 1",
            },
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "magazine with magazineIssueId is not allowed"
      );
    });

    test("magazine data and no magazineIssue data (case 6)", async () => {
      function failToCreate() {
        return References.createReference({
          name: "Magazine Feature Reference 6",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazine: {
              name: "Magazine Fail 2",
            },
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "magazine requires either magazineIssue or magazineIssueId"
      );
    });

    test("magazineIssue data and no magazine data (case 7.1)", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 7.1",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineIssue: {
            magazineId: 1,
            issue: "11",
          },
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt } = cleaned;
        const { magazineIssueId } = reference.magazineFeature ?? {};
        const { createdAt: issueCreatedAt, updatedAt: issueUpdatedAt } =
          cleaned.magazineFeature?.magazineIssue ?? {};

        expect(cleaned).toEqual({
          id,
          createdAt,
          updatedAt,
          name: "Magazine Feature Reference 7.1",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          language: null,
          magazineFeature: {
            magazineIssueId,
            referenceId: id,
            featureTags: [
              {
                id: 1,
                description: "Subject illustrations (in color)",
                name: "color illustrations",
              },
              { id: 2, description: "Color plates", name: "color plates" },
            ],
            magazineIssue: {
              id: magazineIssueId,
              issue: "11",
              magazineId: 1,
              createdAt: issueCreatedAt,
              updatedAt: issueUpdatedAt,
            },
          },
        });
      } else {
        assert.fail("New reference not found");
      }
    });

    test("magazineIssue data and no magazine data (case 7.2)", async () => {
      function failToCreate() {
        return References.createReference({
          name: "Magazine Feature Reference 7.2",
          referenceTypeId: ReferenceTypes.MagazineFeature,
          tags: [{ id: 1 }, { id: 2 }],
          authors: [{ id: 1 }, { id: 2 }],
          magazineFeature: {
            magazineIssue: {
              issue: "12",
            },
            featureTags: [{ id: 1 }, { id: 2 }],
          },
        });
      }

      await expect(() => failToCreate()).rejects.toThrowError(
        "magazineIssue requires either magazine or magazineId"
      );
    });

    test("magazineIssue data and magazine data (case 8)", async () => {
      const reference = await References.createReference({
        name: "Magazine Feature Reference 8",
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: 1 }, { id: 2 }],
        authors: [{ id: 1 }, { id: 2 }],
        magazineFeature: {
          magazineIssue: {
            issue: "13",
          },
          magazine: {
            name: "New Magazine 1",
          },
          featureTags: [{ id: 1 }, { id: 2 }],
        },
      });

      expect(reference).toBeDefined();
      expect(reference.referenceTypeId).toBe(ReferenceTypes.MagazineFeature);
      expect(reference.magazineFeature).toBeDefined();

      const newReference = await References.getReferenceById(reference.id);
      if (newReference) {
        const cleaned = newReference.clean();
        const { id, createdAt, updatedAt, magazineFeature } = cleaned;

        if (magazineFeature && magazineFeature.magazineIssue) {
          const { magazineIssueId } = magazineFeature;
          const {
            createdAt: issueCreatedAt,
            updatedAt: issueUpdatedAt,
            magazineId,
          } = magazineFeature.magazineIssue ?? {};

          expect(cleaned).toEqual({
            id,
            createdAt,
            updatedAt,
            name: "Magazine Feature Reference 8",
            referenceTypeId: ReferenceTypes.MagazineFeature,
            language: null,
            magazineFeature: {
              magazineIssueId,
              referenceId: id,
              featureTags: [
                {
                  id: 1,
                  description: "Subject illustrations (in color)",
                  name: "color illustrations",
                },
                { id: 2, description: "Color plates", name: "color plates" },
              ],
              magazineIssue: {
                id: magazineIssueId,
                issue: "13",
                magazineId,
                createdAt: issueCreatedAt,
                updatedAt: issueUpdatedAt,
              },
            },
          });

          const magazine = await Magazines.getMagazineById(magazineId);
          if (magazine) {
            expect(magazine.name).toBe("New Magazine 1");
          } else {
            assert.fail("Magazine not found");
          }
        } else {
          assert.fail("magazineFeature data missing or incomplete");
        }
      } else {
        assert.fail("New reference not found");
      }
    });
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
  let magazineFeatureIdx: number = 0;

  async function createMagazineFeatureReference(
    magazineFeature: MagazineFeatureForNewReference
  ): Promise<[number, Reference]> {
    magazineFeatureIdx++;
    const magazineFeatureReference = await References.createReference({
      name: `Magazine Feature Reference ${magazineFeatureIdx}`,
      referenceTypeId: ReferenceTypes.MagazineFeature,
      tags: [{ id: 1 }, { id: 2 }],
      authors: [{ id: 1 }, { id: 2 }],
      magazineFeature,
    });

    return [magazineFeatureReference.id, magazineFeatureReference];
  }

  test("Feature tags only", async () => {
    const [magazineFeatureId] = await createMagazineFeatureReference({
      magazineId: 1,
      magazineIssueId: 1,
      featureTags: [{ id: 3 }, { id: 4 }],
    });
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

  test("Empty feature tags", async () => {
    async function failToUpdate() {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 3 }, { id: 4 }],
      });
      await References.updateReferenceById(magazineFeatureId, {
        magazineFeature: {
          featureTags: [],
        },
      });
    }

    await expect(() => failToUpdate()).rejects.toThrowError(
      "featureTags cannot be empty if given"
    );
  });

  test("Empty update (case 0)", async () => {
    const [, reference] = await createMagazineFeatureReference({
      magazineId: 1,
      magazineIssueId: 1,
      featureTags: [{ id: 3 }, { id: 4 }],
    });
    const newReference = await References.updateReferenceById(reference.id, {});

    if (newReference) {
      const cleaned = newReference.clean();
      const { id, createdAt, updatedAt } = cleaned;
      const { createdAt: issueCreatedAt, updatedAt: issueUpdatedAt } =
        cleaned.magazineFeature?.magazineIssue ?? {};

      expect(cleaned).toEqual({
        id,
        createdAt,
        updatedAt,
        name: reference.name,
        referenceTypeId: ReferenceTypes.MagazineFeature,
        language: null,
        magazineFeature: {
          magazineIssueId: 1,
          referenceId: id,
          featureTags: [
            { id: 3, description: "Color profiles", name: "color profiles" },
            { id: 4, description: "Coloring guides", name: "coloring guides" },
          ],
          magazineIssue: {
            id: 1,
            issue: "1",
            magazineId: 1,
            createdAt: issueCreatedAt,
            updatedAt: issueUpdatedAt,
          },
        },
      });
    } else {
      assert.fail("New reference not found");
    }
  });

  describe("Combinations of magazine/issue updates", () => {
    // Try to test all the combinations of magazine and issue updates, where
    // each can be either a given ID or a new object. See the (large) comment
    // block in db/references.ts (`fixupMagazineFeatureForUpdate`) for more
    // details.

    test("magazineId only (case 1)", async () => {
      async function failToUpdate() {
        const [magazineFeatureId] = await createMagazineFeatureReference({
          magazineId: 1,
          magazineIssueId: 1,
          featureTags: [{ id: 1 }, { id: 2 }],
        });
        await References.updateReferenceById(magazineFeatureId, {
          magazineFeature: {
            magazineId: 2,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "magazineId by itself is not allowed"
      );
    });

    test("magazineIssueId only (case 2.1)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      const reference = await References.updateReferenceById(
        magazineFeatureId,
        {
          magazineFeature: {
            magazineIssueId: 2,
          },
        }
      );

      expect(reference).toBeDefined();
      if (reference?.magazineFeature?.magazineIssue) {
        expect(reference.magazineFeature.magazineIssue.issue).toBe("2");
        expect(reference.magazineFeature.magazineIssue.magazineId).toBe(1);
      } else {
        assert.fail("Updated reference magazineFeature not found");
      }
    });

    test("magazineIssueId only (case 2.2)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      const reference = await References.updateReferenceById(
        magazineFeatureId,
        {
          magazineFeature: {
            magazineIssueId: 7,
          },
        }
      );

      expect(reference).toBeDefined();
      if (reference?.magazineFeature?.magazineIssue) {
        expect(reference.magazineFeature.magazineIssue.issue).toBe("2");
        expect(reference.magazineFeature.magazineIssue.magazineId).toBe(2);
      } else {
        assert.fail("Updated reference magazineFeature not found");
      }
    });

    test("magazineId and magazineIssueId (case 3.1)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      async function failToUpdate() {
        await References.updateReferenceById(magazineFeatureId, {
          magazineFeature: {
            magazineId: 1,
            magazineIssueId: 6,
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "magazineId conflicts with the ID of the given magazineIssueId"
      );
    });

    test("magazineId and magazineIssueId (case 3.2)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      const reference = await References.updateReferenceById(
        magazineFeatureId,
        {
          magazineFeature: {
            magazineId: 2,
            magazineIssueId: 7,
          },
        }
      );

      expect(reference).toBeDefined();
      if (reference?.magazineFeature?.magazineIssue) {
        expect(reference.magazineFeature.magazineIssue.issue).toBe("2");
        expect(reference.magazineFeature.magazineIssue.magazineId).toBe(2);
      } else {
        assert.fail("Updated reference magazineFeature not found");
      }
    });

    test("magazineId and magazineIssue data (case 4)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
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
      if (reference?.magazineFeature?.magazineIssue) {
        expect(reference.magazineFeature.magazineIssue.issue).toBe("4 test");
        expect(reference.magazineFeature.magazineIssue.magazineId).toBe(1);
      } else {
        assert.fail("Updated reference magazineFeature not found");
      }
    });

    test("magazine data and issue ID (case 5)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
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

      await expect(() => failToUpdate()).rejects.toThrowError(
        "new magazine data with existing magazineIssueId is not allowed"
      );
    });

    test("magazine data and no issue data (case 6)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      async function failToUpdate() {
        await References.updateReferenceById(magazineFeatureId, {
          magazineFeature: {
            magazine: {
              name: "Test",
            },
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "new magazine data with no magazineIssue data is not allowed"
      );
    });

    test("magazineIssue data and no magazine data (case 7.1)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
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
      if (reference?.magazineFeature?.magazineIssue) {
        expect(reference.magazineFeature.magazineIssue.issue).toBe("7.1 test");
        expect(reference.magazineFeature.magazineIssue.magazineId).toBe(1);
      } else {
        assert.fail("Updated reference magazineFeature not found");
      }
    });

    test("magazineIssue data and no magazine data (case 7.2)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
      async function failToUpdate() {
        await References.updateReferenceById(magazineFeatureId, {
          magazineFeature: {
            magazineIssue: {
              issue: "7.2 test",
              magazineId: 2,
            },
          },
        });
      }

      await expect(() => failToUpdate()).rejects.toThrowError(
        "new magazineIssue data magazineId conflicts with existing magazineId"
      );
    });

    test("magazineIssue data & magazine data (case 8)", async () => {
      const [magazineFeatureId] = await createMagazineFeatureReference({
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      });
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
      if (reference?.magazineFeature?.magazineIssue) {
        const magazine = await Magazine.findOne({
          where: { name: "Test 8" },
        });
        if (!magazine) {
          assert.fail("Newly-created Magazine not found");
        } else {
          expect(reference.magazineFeature.magazineIssue.issue).toBe("8 test");
          expect(reference.magazineFeature.magazineIssue.magazineId).toBe(
            magazine?.id
          );
        }
      } else {
        assert.fail("Updated reference magazineFeature not found");
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
