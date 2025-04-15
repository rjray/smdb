/**
 * Test suite for the database code in the `db/featuretags.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import {
  FeatureTags,
  Magazines,
  MagazineIssues,
  References,
} from "../../src/db";
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
        tags: [{ id: 1 }, { id: 2 }],
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

describe("FeatureTags: Create", () => {
  test("Create basic feature tag", async () => {
    const featureTag = await FeatureTags.createFeatureTag({
      name: "Feature 1",
    });

    expect(featureTag.id).toBe(30);
    expect(featureTag.name).toBe("Feature 1");
  });

  test("Create feature tag with conflicting name", async () => {
    async function failToCreate() {
      return await FeatureTags.createFeatureTag({
        name: "Feature 1",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("FeatureTags: Retrieve", () => {
  test("Get all feature tags", async () => {
    const featureTags = await FeatureTags.getAllFeatureTags();

    expect(featureTags.length >= 29).toBe(true);
    expect(featureTags[0].id).toBe(1);
    expect(featureTags[0].name).toBe("color illustrations");
  });

  test("Get all feature tags with reference counts", async () => {
    const featureTags = await FeatureTags.getAllFeatureTags({
      referenceCount: true,
    });

    const counts = [5, 10, 10, 10, 10, 5];
    const withRefs = featureTags.slice(0, 6);
    withRefs.forEach((featureTag, i) => {
      expect(featureTag.referenceCount).toBe(counts[i]);
    });
  });

  test("Get feature tag by ID", async () => {
    const featureTag = await FeatureTags.getFeatureTagById(1);

    if (featureTag) {
      expect(featureTag.id).toBe(1);
      expect(featureTag.name).toBe("color illustrations");
    } else {
      assert.fail("No feature tag found");
    }
  });

  test("Get feature tag by ID with features", async () => {
    const featureTag = await FeatureTags.getFeatureTagById(1, {
      features: true,
    });

    if (featureTag) {
      expect(featureTag.id).toBe(1);
      expect(featureTag.name).toBe("color illustrations");
      if (featureTag.magazineFeatures) {
        expect(featureTag.magazineFeatures.length).toBe(5);
      } else {
        assert.fail("No featureTag.magazineFeatures found");
      }
    } else {
      assert.fail("No feature tag found");
    }
  });
});

describe("FeatureTags: Update", () => {
  test("Update feature tag", async () => {
    const featureTag = await FeatureTags.getFeatureTagById(1);
    if (featureTag) {
      expect(featureTag.id).toBe(1);
      expect(featureTag.name).toBe("color illustrations");
      const result = await FeatureTags.updateFeatureTagById(1, {
        name: "color illustrations updated",
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe("color illustrations updated");
    } else {
      assert.fail("No feature tag found");
    }
  });
});

describe("FeatureTags: Delete", () => {
  test("Delete feature tag", async () => {
    const result = await FeatureTags.deleteFeatureTagById(1);
    expect(result).toBe(1);
  });
});
