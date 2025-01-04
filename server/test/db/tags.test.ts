/**
 * Test suite for the database code in the `db/tags.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Tags, Magazines, MagazineIssues, References } from "db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();

  // Create some magazines and issues here, before tests run. This way, if only
  // a single test runs, it will still have the data on hand.
  for (const magazineId of [1, 2, 3, 4, 5]) {
    await Magazines.createMagazine({
      name: `Magazine ${magazineId}`,
      id: magazineId,
    });

    for (const issueId of [1, 2, 3, 4, 5]) {
      const issue = await MagazineIssues.createMagazineIssue({
        magazineId,
        issue: String(issueId),
      });

      await References.createReference({
        name: `Magazine Feature ${magazineId}`,
        referenceTypeId: ReferenceTypes.MagazineFeature,
        tags: [{ id: issueId }, { id: issueId + 1 }],
        magazineFeature: {
          magazineId,
          magazineIssueId: issue.id,
          featureTags: [{ id: issueId }, { id: issueId + 1 }],
        },
      });
    }
  }
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Tags: Create", () => {
  test("Create basic tag", async () => {
    const tag = await Tags.createTag({
      name: "Tag 1",
    });

    expect(tag.id).toBe(68);
    expect(tag.name).toBe("Tag 1");
  });

  test("Create feature tag with conflicting name", async () => {
    async function failToCreate() {
      return await Tags.createTag({
        name: "Tag 1",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("Tags: Retrieve", () => {
  test("Get all tags", async () => {
    const tags = await Tags.getAllTags();

    expect(tags.length).toBe(68);
    expect(tags[0].id).toBe(1);
    expect(tags[0].name).toBe("aircraft");
  });

  test("Get all tags with reference counts", async () => {
    const tags = await Tags.getAllTags({
      referenceCount: true,
    });

    const counts = [5, 10, 10, 10, 10, 5];
    const withRefs = tags.slice(0, 6);
    withRefs.forEach((tag, i) => {
      expect(tag.referenceCount).toBe(counts[i]);
    });
  });

  test("Get tag by ID", async () => {
    const tag = await Tags.getTagById(1);

    if (tag) {
      expect(tag.id).toBe(1);
      expect(tag.name).toBe("aircraft");
    } else {
      assert.fail("No feature tag found");
    }
  });

  test("Get tag by ID with references", async () => {
    const tag = await Tags.getTagById(1, {
      references: true,
    });

    if (tag) {
      expect(tag.id).toBe(1);
      expect(tag.name).toBe("aircraft");
      if (tag.references) {
        expect(tag.references.length).toBe(5);
      } else {
        assert.fail("No tag.references found");
      }
    } else {
      assert.fail("No feature tag found");
    }
  });
});

describe("Tags: Update", () => {
  test("Update tag", async () => {
    const tag = await Tags.getTagById(1);
    if (tag) {
      expect(tag.id).toBe(1);
      expect(tag.name).toBe("aircraft");
      const result = await Tags.updateTagById(1, {
        name: "aircraft updated",
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe("aircraft updated");
    } else {
      assert.fail("No feature tag found");
    }
  });
});

describe("Tags: Delete", () => {
  test("Delete tag", async () => {
    const result = await Tags.deleteTagById(68);
    expect(result).toBe(1);
  });
});
