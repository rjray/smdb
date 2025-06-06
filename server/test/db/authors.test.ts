/**
 * Test suite for the database code in the `db/authors.ts` module.
 */

import { afterAll, beforeAll, describe, expect, test, assert } from "vitest";

import { setupTestDatabase, tearDownTestDatabase } from "../database";
import { Authors, References } from "../../src/db";
// Need a full relative path due to deprecated "constants" module in Node.
import { ReferenceTypes } from "../../src/constants";

beforeAll(async () => {
  await setupTestDatabase();
});
afterAll(async () => {
  await tearDownTestDatabase();
});

describe("Authors: Create", () => {
  test("Create basic author", async () => {
    const author = await Authors.createAuthor({
      name: "Author 1",
    });

    expect(author.id).toBe(1);
    expect(author.name).toBe("Author 1");
    expect(author.aliases).toBeUndefined();
    expect(author.references).toBeUndefined();
  });

  test("Create author with aliases", async () => {
    const author = await Authors.createAuthor({
      name: "Author 2",
      aliases: [{ name: "Alias 1" }, { name: "Alias 2" }],
    });

    expect(author.id).toBe(2);
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

describe("Authors: Retrieve", () => {
  test("Get all authors", async () => {
    const authors = await Authors.getAllAuthors();
    expect(authors.length).toBe(2);
  });

  test("Get all authors with reference counts", async () => {
    const authors = await Authors.getAllAuthors({ referenceCount: true });

    expect(authors.length).toBe(2);
    expect(authors[0].referenceCount).toBe(0);
    expect(authors[1].referenceCount).toBe(0);
  });

  test("Get author by ID", async () => {
    const author = await Authors.getAuthorById(1);

    if (author) {
      expect(author.id).toBe(1);
      expect(author.name).toBe("Author 1");

      const cleaned = author.clean();
      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      expect(cleaned).toEqual({
        id: 1,
        name: "Author 1",
        createdAt,
        updatedAt,
      });
    } else {
      assert.fail("Failed to fetch author by ID");
    }
  });

  test("Get author by ID with aliases", async () => {
    const author = await Authors.getAuthorById(2, {
      aliases: true,
      referenceCount: true,
    });

    if (author) {
      expect(author.id).toBe(2);
      expect(author.name).toBe("Author 2");
      expect(author.referenceCount).toBe(0);
      if (author.aliases) {
        expect(author.aliases.length).toBe(2);
        expect(author.aliases[0].name).toBe("Alias 1");
        expect(author.aliases[1].name).toBe("Alias 2");
      } else {
        assert.fail("No author.aliases found");
      }

      const cleaned = author.clean();
      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      expect(cleaned).toEqual({
        id: 2,
        name: "Author 2",
        referenceCount: 0,
        createdAt,
        updatedAt,
        aliases: [
          { id: 1, name: "Alias 1", authorId: 2 },
          { id: 2, name: "Alias 2", authorId: 2 },
        ],
      });
    } else {
      assert.fail("Failed to fetch author by ID");
    }
  });

  test("Get author by ID with (no) references", async () => {
    const author = await Authors.getAuthorById(1, { references: true });

    if (author) {
      expect(author.id).toBe(1);
      expect(author.name).toBe("Author 1");
      expect(author.aliases).toBeUndefined();
      if (author.references) {
        expect(author.references.length).toBe(0);
      } else {
        assert.fail("No author.references found");
      }

      const cleaned = author.clean();
      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      expect(cleaned).toEqual({
        id: 1,
        name: "Author 1",
        createdAt,
        updatedAt,
        references: [],
      });
    } else {
      assert.fail("Failed to fetch author by ID");
    }
  });

  test("Get author by ID with references and aliases", async () => {
    // Start by creating a very basic (photo collection) reference for the
    // author.
    const reference = await References.createReference({
      name: "Reference 1",
      referenceTypeId: ReferenceTypes.PhotoCollection,
      tags: [{ name: "Tag 1" }, { name: "Tag 2" }],
      authors: [{ name: "Author 2", id: 2 }],
      photoCollection: {
        location: "Location 1",
        media: "Media 1",
      },
    });

    const author = await Authors.getAuthorById(2, {
      references: true,
      aliases: true,
    });

    if (author) {
      expect(author.id).toBe(2);
      expect(author.name).toBe("Author 2");
      if (author.aliases) {
        expect(author.aliases.length).toBe(2);
        expect(author.aliases[0].name).toBe("Alias 1");
        expect(author.aliases[1].name).toBe("Alias 2");
      } else {
        assert.fail("No author.aliases found");
      }
      if (author.references) {
        expect(author.references.length).toBe(1);
      } else {
        assert.fail("No author.references found");
      }

      const cleaned = author.clean();
      const refCleaned = reference.clean();
      // We know these will be present and valid, since Sequelize handles them.
      const { createdAt, updatedAt } = cleaned;
      expect(cleaned).toEqual({
        id: 2,
        name: "Author 2",
        createdAt,
        updatedAt,
        aliases: [
          { id: 1, name: "Alias 1", authorId: 2 },
          { id: 2, name: "Alias 2", authorId: 2 },
        ],
        references: [
          {
            id: 1,
            name: "Reference 1",
            language: null,
            referenceTypeId: 3,
            photoCollection: {
              location: "Location 1",
              media: "Media 1",
              referenceId: 1,
            },
            createdAt: `${refCleaned.createdAt}`,
            updatedAt: `${refCleaned.updatedAt}`,
          },
        ],
      });
    } else {
      assert.fail("Failed to fetch author by ID");
    }
  });
});

describe("Authors: Update", () => {
  test("Update author by ID (name only)", async () => {
    const author = await Authors.updateAuthorById(1, {
      name: "Updated Author 1",
    });
    expect(author?.name).toBe("Updated Author 1");
  });

  test("Update author by ID (name and aliases)", async () => {
    await Authors.updateAuthorById(2, {
      name: "Updated Author 2",
      aliases: [{ name: "Updated Alias 1" }, { name: "Updated Alias 2" }],
    });
    const author = await Authors.getAuthorById(2, { aliases: true });

    expect(author?.name).toBe("Updated Author 2");
    if (author?.aliases) {
      expect(author.aliases.length).toBe(2);
      expect(author.aliases[0].name).toBe("Updated Alias 1");
      expect(author.aliases[1].name).toBe("Updated Alias 2");
    } else {
      assert.fail("No author.aliases found");
    }
  });

  test("Update non-existent author", async () => {
    async function failToUpdate() {
      return await Authors.updateAuthorById(999999999, {
        name: "1 Updated",
      });
    }
    await expect(failToUpdate).rejects.toThrow();
  });
});

describe("Authors: Delete", () => {
  test("Delete author by ID", async () => {
    await Authors.deleteAuthorById(1);
    const authors = await Authors.getAllAuthors();
    expect(authors.length).toBe(1);
    expect(authors[0].id).toBe(2);
  });
});
