/**
 * Test suite for the database code in the `db/magazines.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Magazines, MagazineIssues } from "../../src/db";

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

describe("Magazines: Create", () => {
  test("Create basic Magazine", async () => {
    const magazine = await Magazines.createMagazine({
      name: "Magazine 6",
    });

    expect(magazine.id).toBe(6);
    expect(magazine.name).toBe("Magazine 6");
    expect(magazine.issues).toBeUndefined();
  });

  test("Create Magazine with conflicting name", async () => {
    async function failToCreate() {
      return await Magazines.createMagazine({
        name: "Magazine 1",
      });
    }

    await expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("Magazines: Retrieve", () => {
  test("Get all Magazines", async () => {
    const magazines = await Magazines.getAllMagazines();

    expect(magazines.length).toBe(6);
    expect(magazines[0].id).toBe(1);
    expect(magazines[0].name).toBe("Magazine 1");
    expect(magazines[0].issues).toBeUndefined();
  });

  test("Get magazine by ID", async () => {
    const magazine = await Magazines.getMagazineById(1);

    if (magazine) {
      expect(magazine.id).toBe(1);
      expect(magazine.name).toBe("Magazine 1");
      expect(magazine.issues).toBeUndefined();
    } else {
      assert.fail("No magazine found");
    }
  });

  test("Get magazine by ID with issues", async () => {
    const magazine = await Magazines.getMagazineById(1, {
      issues: true,
    });

    if (magazine) {
      expect(magazine.id).toBe(1);
      expect(magazine.name).toBe("Magazine 1");
      if (magazine.issues) {
        expect(magazine.issues.length).toBe(5);
      } else {
        assert.fail("No magazine.issues found");
      }

      // Check that each issue is present
      const cleaned = magazine.clean();
      const issues = magazine.issues?.map((issue) => issue.clean());
      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      expect(cleaned).toEqual({
        id: 1,
        name: "Magazine 1",
        language: null,
        aliases: null,
        notes: null,
        createdAt,
        updatedAt,
        issues,
      });
    } else {
      assert.fail("No magazine found");
    }
  });

  test("Get all Magazines with issues", async () => {
    const magazines = await Magazines.getAllMagazines({
      issues: true,
    });

    expect(magazines.length).toBe(6);
    for (const id of [1, 2, 3, 4, 5]) {
      expect(magazines[id - 1].id).toBe(id);
      expect(magazines[id - 1].name).toBe(`Magazine ${id}`);
      expect(magazines[id - 1].issues).toHaveLength(5);
    }
    expect(magazines[5].id).toBe(6);
    expect(magazines[5].name).toBe("Magazine 6");
    expect(magazines[5].issues).toHaveLength(0);
  });
});

describe("Magazines: Update", () => {
  test("Update basic Magazine", async () => {
    const magazine = await Magazines.updateMagazineById(6, {
      name: "Magazine 6 Updated",
      language: "English",
    });

    if (magazine) {
      expect(magazine.id).toBe(6);
      expect(magazine.name).toBe("Magazine 6 Updated");
      expect(magazine.language).toBe("English");
    } else {
      assert.fail("No magazine returned by update");
    }
  });
});

describe("Magazines: Delete", () => {
  test("Delete Magazine by ID", async () => {
    const result = await Magazines.deleteMagazineById(6);
    expect(result).toBe(1);
    const magazines = await Magazines.getAllMagazines();
    expect(magazines.length).toBe(5);
  });

  test("Delete non-existent Magazine", async () => {
    const result = await Magazines.deleteMagazineById(6);
    expect(result).toBe(0);
  });
});

describe("Magazines: Misc", () => {
  test("Test getRecentlyUpdatedMagazines", async () => {
    const magazines = await Magazines.getRecentlyUpdatedMagazines();
    expect(magazines.length).toBe(5);
    expect(magazines.map((m) => m.id)).toEqual([5, 4, 3, 2, 1]);
  });
});
