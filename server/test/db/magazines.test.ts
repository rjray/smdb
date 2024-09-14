/**
 * Test suite for the database code in the `db/authors.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";
import fs from "fs";

import setupDatabase from "database/setup";
import { Magazines, MagazineIssues } from "db";

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

describe("Magazines: Creation", () => {
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

    expect(() => failToCreate()).rejects.toThrowError("Validation error");
  });
});

describe("Magazines: Retrieval", () => {
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
    const magazine = await Magazines.getMagazineById(1, { issues: true });

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
