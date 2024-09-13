/**
 * Test suite for the database code in the `db/authors.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";
import fs from "fs";

import setupDatabase from "database/setup";
import { Authors } from "db";

// Need to have this here in case the test file is an actual file rather than
// an in-memory database.
const file = process.env.DATABASE_FILE || ":memory:";

beforeAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  await setupDatabase("src");
});
afterAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});

describe("Authors: Creation", () => {
  test("Create a basic author", async () => {
    const author = await Authors.addAuthor({
      name: "Author 1",
    });

    expect(author.name).toBe("Author 1");
    expect(author.aliases).toBeUndefined();
    expect(author.references).toBeUndefined();
  });

  test("Create an author with aliases", async () => {
    const author = await Authors.addAuthor({
      name: "Author 2",
      aliases: [{ name: "Alias 1" }, { name: "Alias 2" }],
    });

    expect(author.name).toBe("Author 2");
    if (author.aliases) {
      expect(author.aliases.length).toBe(2);
      expect(author.aliases[0].name).toBe("Alias 1");
      expect(author.aliases[1].name).toBe("Alias 2");
    } else {
      assert.fail("No author.aliases found");
    }
    expect(author.references).toBeUndefined();
  });
});

describe("Authors: Retrieval", () => {
  test("Get all authors", async () => {
    const authors = await Authors.fetchAllAuthors();
    expect(authors.length).toBe(2);
  });

  test("Get author by ID", async () => {
    const author = await Authors.fetchOneAuthor(1);
    expect(author?.id).toBe(1);
    expect(author?.name).toBe("Author 1");
  });

  test("Get author with aliases by ID", async () => {
    const author = await Authors.fetchOneAuthor(2, { aliases: true });
    expect(author?.id).toBe(2);
    if (author?.aliases) {
      expect(author.aliases.length).toBe(2);
      expect(author.aliases[0].name).toBe("Alias 1");
      expect(author.aliases[1].name).toBe("Alias 2");
    } else {
      assert.fail("No author.aliases found");
    }
  });
});
