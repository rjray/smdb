/**
 * Test suite for the database code in the `db/magazineissues.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Magazines, MagazineIssues, References } from "../../src/db";
import { MagazineFeature } from "../../src/models";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();

  // Create some magazines and issues here, before tests run. This way, if only
  // a single test runs, it will still have the data on hand.
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
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("MagazineIssues: Create", () => {
  test("Create basic magazine issue", async () => {
    const issue = await MagazineIssues.createMagazineIssue({
      magazineId: 1,
      issue: "6",
    });

    expect(issue.magazineId).toBe(1);
    expect(issue.issue).toBe("6");
  });

  test("Attempt to create duplicate magazine issue", async () => {
    async function failToCreate() {
      return await MagazineIssues.createMagazineIssue({
        magazineId: 1,
        issue: "6",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("MagazineIssues: Retrieve", () => {
  test("Get all magazine issues without magazine ID", async () => {
    const issues = await MagazineIssues.getAllMagazineIssues();

    if (issues) {
      // Look for 25 or 26, in case this test is run without the previous tests
      // having run first.
      expect(issues.length).toBeOneOf([25, 26]);
    } else {
      assert.fail("No magazine issues found");
    }
  });

  test("Get all magazine issues for one magazine ID", async () => {
    const issues = await MagazineIssues.getAllMagazineIssues({
      magazineId: 5,
      referenceCount: true,
    });

    if (issues) {
      expect(issues.length).toBe(5);
      expect(issues[0].referenceCount).toBe(0);
    } else {
      assert.fail("No magazine issues found");
    }
  });

  test("Get magazine issue by ID with refcount", async () => {
    const issue = await MagazineIssues.getMagazineIssueById(1, {
      referenceCount: true,
    });

    if (issue) {
      expect(issue.magazineId).toBe(1);
      expect(issue.issue).toBe("1");
      expect(issue.referenceCount).toBe(0);
    } else {
      assert.fail("No magazine issue found");
    }
  });

  test("Get magazine issue by ID with magazine", async () => {
    const issue = await MagazineIssues.getMagazineIssueById(1, {
      magazine: true,
    });

    if (issue) {
      const cleaned = issue.clean();

      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      const { createdAt: magazineCreatedAt, updatedAt: magazineUpdatedAt } =
        cleaned.magazine || {};
      expect(cleaned).toEqual({
        id: 1,
        issue: "1",
        magazineId: 1,
        createdAt,
        updatedAt,
        magazine: {
          id: 1,
          name: "Magazine 1",
          language: null,
          aliases: null,
          notes: null,
          createdAt: magazineCreatedAt,
          updatedAt: magazineUpdatedAt,
        },
      });
    } else {
      assert.fail("No magazine issue found");
    }
  });

  test("Get magazine issue by ID with features", async () => {
    // Start by creating a very basic magazine feature reference for the issue.
    await References.createReference({
      name: "Reference 1",
      referenceTypeId: ReferenceTypes.MagazineFeature,
      tags: [{ name: "Tag 1" }, { name: "Tag 2" }],
      magazineFeature: {
        magazineId: 1,
        magazineIssueId: 1,
        featureTags: [{ id: 1 }, { id: 2 }],
      },
    });

    const issue = await MagazineIssues.getMagazineIssueById(1, {
      features: true,
      referenceCount: true,
    });

    if (issue) {
      const cleaned = issue.clean();

      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      const { createdAt: mfCreatedAt, updatedAt: mfUpdatedAt } =
        cleaned.magazineFeatures?.[0].magazineIssue || {};
      expect(cleaned).toEqual({
        id: 1,
        issue: "1",
        magazineId: 1,
        referenceCount: 1,
        createdAt,
        updatedAt,
        magazineFeatures: [
          {
            referenceId: 1,
            magazineIssueId: 1,
            magazineIssue: {
              id: 1,
              issue: "1",
              magazineId: 1,
              createdAt: mfCreatedAt,
              updatedAt: mfUpdatedAt,
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
        ],
      });
    } else {
      assert.fail("No magazine issue found");
    }
  });
});

describe("MagazineIssues: Update", () => {
  test("Update basic magazine issue", async () => {
    const magazineIssue = await MagazineIssues.updateMagazineIssueById(1, {
      issue: "1 Updated",
    });

    expect(magazineIssue?.issue).toBe("1 Updated");
  });

  test("Update non-existent magazine issue", async () => {
    async function failToUpdate() {
      return await MagazineIssues.updateMagazineIssueById(999999999, {
        issue: "1 Updated",
      });
    }
    await expect(failToUpdate).rejects.toThrow();
  });
});

describe("MagazineIssues: Delete", () => {
  test("Delete basic magazine issue", async (context) => {
    const count = (await MagazineIssues.getAllMagazineIssues()).length;
    if (count < 26) context.skip();

    const result = await MagazineIssues.deleteMagazineIssueById(1);
    expect(result).toBe(1);

    const magazine = await Magazines.getMagazineById(1, {
      issues: true,
    });
    if (magazine) {
      expect(magazine.issues?.length).toBe(5);
    } else {
      assert.fail("No magazine found");
    }

    const magazineFeature = await MagazineFeature.findByPk(1);
    expect(magazineFeature).toBeNull();
  });

  test("Delete non-existent magazine issue", async () => {
    const result = await MagazineIssues.deleteMagazineIssueById(100);
    expect(result).toBe(0);
  });
});
