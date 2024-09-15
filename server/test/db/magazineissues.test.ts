/**
 * Test suite for the database code in the `db/magazineissues.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";
import fs from "fs";

import setupDatabase from "database/setup";
import { Magazines, MagazineIssues, References } from "db";
import { MagazineFeature } from "models";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

// Need to have this here in case the test file is an actual file rather than
// an in-memory database.
const file = process.env.DATABASE_FILE || ":memory:";

beforeAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  await setupDatabase("src");

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
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});

describe("MagazineIssues: Creation", () => {
  test("Create basic magazine issue", async () => {
    const issue = await MagazineIssues.createMagazineIssue({
      id: 26,
      magazineId: 1,
      issue: "6",
    });

    expect(issue.id).toBe(26);
    expect(issue.magazineId).toBe(1);
    expect(issue.issue).toBe("6");
  });
});

describe("MagazineIssues: Retrieval", () => {
  test("Get magazine issue by ID", async () => {
    const issue = await MagazineIssues.getMagazineIssueById(26);

    if (issue) {
      expect(issue.magazineId).toBe(1);
      expect(issue.issue).toBe("6");
    } else {
      assert.fail("No magazine issue found");
    }
  });

  test("Get magazine issue by ID with magazine", async () => {
    const issue = await MagazineIssues.getMagazineIssueById(26, {
      magazine: true,
    });

    if (issue) {
      const cleaned = issue.clean();

      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      const { createdAt: magazineCreatedAt, updatedAt: magazineUpdatedAt } =
        cleaned.magazine || {};
      expect(cleaned).toEqual({
        id: 26,
        issue: "6",
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
        magazineIssueId: 26,
        featureTags: [{ id: 1 }, { id: 2 }],
      },
    });

    const issue = await MagazineIssues.getMagazineIssueById(26, {
      features: true,
    });

    if (issue) {
      const cleaned = issue.clean();

      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      const { createdAt: mfCreatedAt, updatedAt: mfUpdatedAt } =
        cleaned.magazineFeatures?.[0].magazineIssue || {};
      expect(cleaned).toEqual({
        id: 26,
        issue: "6",
        magazineId: 1,
        createdAt,
        updatedAt,
        magazineFeatures: [
          {
            referenceId: 1,
            magazineIssueId: 26,
            magazineIssue: {
              id: 26,
              issue: "6",
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
    const magazineIssue = await MagazineIssues.updateMagazineIssueById(26, {
      issue: "6 Updated",
    });

    expect(magazineIssue.id).toBe(26);
    expect(magazineIssue.issue).toBe("6 Updated");
  });
});

describe("MagazineIssues: Delete", () => {
  test("Delete basic magazine issue", async () => {
    const result = await MagazineIssues.deleteMagazineIssueById(26);
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
});
