import { afterAll, beforeAll, describe, expect, test } from "vitest";
import fs from "fs";

import setupDatabase from "database/setup";
import { Authors } from "db";

const file = process.env.DATABASE_FILE || "test.db";

beforeAll(async () => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  await setupDatabase(file, "src/database");
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
});
