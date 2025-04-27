/**
 * Test suite for the controller code in the `controllers/authorsController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthorById,
  deleteAuthorById,
} from "../../src/controllers/authorsController";
import { ExegesisContext } from "exegesis";

import { Authors } from "../../src/db";
import { Author } from "../../src/models";

// Mock the Authors module
vi.mock("../../src/db", () => ({
  Authors: {
    createAuthor: vi.fn(),
    getAllAuthors: vi.fn(),
    getAuthorById: vi.fn(),
    updateAuthorById: vi.fn(),
    deleteAuthorById: vi.fn(),
  },
}));

// Helper to create a mock Exegesis context
const createMockContext = (
  options: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    requestBody?: unknown;
  } = {}
): ExegesisContext => {
  const { path = {}, query = {}, requestBody = {} } = options;

  return {
    params: {
      path,
      query,
    },
    requestBody,
    res: {
      status: vi.fn().mockReturnThis(),
      pureJson: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    },
  } as unknown as ExegesisContext;
};

// Helper to create a mock Author
function createMockAuthor(id = 1, name = "Test Author") {
  const author = {
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    clean: vi.fn().mockReturnValue({
      id,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };
  return author;
}

describe("Authors Controller", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createAuthor", () => {
    test("should create a new author and return 201 status", async () => {
      const mockAuthor = createMockAuthor();
      const mockContext = createMockContext({
        requestBody: { name: "Test Author" },
      });

      vi.mocked(Authors.createAuthor).mockResolvedValue(
        mockAuthor as unknown as Author
      );

      await createAuthor(mockContext as unknown as ExegesisContext);

      expect(Authors.createAuthor).toHaveBeenCalledWith({
        name: "Test Author",
      });
      expect(mockContext.res.status).toHaveBeenCalledWith(201);
      expect(mockContext.res.pureJson).toHaveBeenCalledWith(mockAuthor.clean());
    });

    test("should handle errors when creating an author", async () => {
      const mockContext = createMockContext({
        requestBody: { name: "Test Author" },
      });

      const error = new Error("Database error");
      vi.mocked(Authors.createAuthor).mockRejectedValue(error);

      await expect(
        createAuthor(mockContext as unknown as ExegesisContext)
      ).rejects.toThrow("Database error");
    });
  });

  describe("getAllAuthors", () => {
    test("should return all authors with 200 status", async () => {
      const mockAuthors = [
        createMockAuthor(1, "Author 1"),
        createMockAuthor(2, "Author 2"),
      ];

      const mockContext = createMockContext();

      vi.mocked(Authors.getAllAuthors).mockResolvedValue(
        mockAuthors as unknown as Author[]
      );

      await getAllAuthors(mockContext as unknown as ExegesisContext);

      expect(Authors.getAllAuthors).toHaveBeenCalled();
      expect(mockContext.res.status).toHaveBeenCalledWith(200);
      expect(mockContext.res.pureJson).toHaveBeenCalledWith(
        mockAuthors.map((author) => author.clean())
      );
    });

    test("should pass query options to getAllAuthors", async () => {
      const mockAuthors = [createMockAuthor()];
      const mockContext = createMockContext({
        query: { aliases: true, references: true },
      });

      vi.mocked(Authors.getAllAuthors).mockResolvedValue(
        mockAuthors as unknown as Author[]
      );

      await getAllAuthors(mockContext as unknown as ExegesisContext);

      expect(Authors.getAllAuthors).toHaveBeenCalledWith({
        aliases: true,
        references: true,
      });
    });
  });

  describe("getAuthorById", () => {
    test("should return an author by ID with 200 status", async () => {
      const mockAuthor = createMockAuthor();
      const mockContext = createMockContext({
        path: { id: "1" },
      });

      vi.mocked(Authors.getAuthorById).mockResolvedValue(
        mockAuthor as unknown as Author
      );

      await getAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.getAuthorById).toHaveBeenCalledWith("1", {});
      expect(mockContext.res.status).toHaveBeenCalledWith(200);
      expect(mockContext.res.pureJson).toHaveBeenCalledWith(mockAuthor.clean());
    });

    test("should return 404 when author is not found", async () => {
      const mockContext = createMockContext({
        path: { id: "999" },
      });

      vi.mocked(Authors.getAuthorById).mockResolvedValue(null);

      await getAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.getAuthorById).toHaveBeenCalledWith("999", {});
      expect(mockContext.res.status).toHaveBeenCalledWith(404);
      expect(mockContext.res.end).toHaveBeenCalled();
    });

    test("should pass query options to getAuthorById", async () => {
      const mockAuthor = createMockAuthor();
      const mockContext = createMockContext({
        path: { id: "1" },
        query: { aliases: true, references: true },
      });

      vi.mocked(Authors.getAuthorById).mockResolvedValue(
        mockAuthor as unknown as Author
      );

      await getAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.getAuthorById).toHaveBeenCalledWith("1", {
        aliases: true,
        references: true,
      });
    });
  });

  describe("updateAuthorById", () => {
    test("should update an author and return 200 status", async () => {
      const mockAuthor = createMockAuthor(1, "Updated Author");
      const mockContext = createMockContext({
        path: { id: "1" },
        requestBody: { name: "Updated Author" },
      });

      vi.mocked(Authors.updateAuthorById).mockResolvedValue(
        mockAuthor as unknown as Author
      );

      await updateAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.updateAuthorById).toHaveBeenCalledWith("1", {
        name: "Updated Author",
      });
      expect(mockContext.res.status).toHaveBeenCalledWith(200);
      expect(mockContext.res.pureJson).toHaveBeenCalledWith(mockAuthor.clean());
    });

    test("should return 404 when author to update is not found", async () => {
      const mockContext = createMockContext({
        path: { id: "999" },
        requestBody: { name: "Updated Author" },
      });

      vi.mocked(Authors.updateAuthorById).mockResolvedValue(null);

      await updateAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.updateAuthorById).toHaveBeenCalledWith("999", {
        name: "Updated Author",
      });
      expect(mockContext.res.status).toHaveBeenCalledWith(404);
      expect(mockContext.res.end).toHaveBeenCalled();
    });

    test("should filter out deleted aliases", async () => {
      const mockAuthor = createMockAuthor();
      const mockContext = createMockContext({
        path: { id: "1" },
        requestBody: {
          name: "Updated Author",
          aliases: [
            { name: "Valid Alias" },
            { name: "Deleted Alias", deleted: true },
          ],
        },
      });

      vi.mocked(Authors.updateAuthorById).mockResolvedValue(
        mockAuthor as unknown as Author
      );

      await updateAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.updateAuthorById).toHaveBeenCalledWith("1", {
        name: "Updated Author",
        aliases: [{ name: "Valid Alias" }],
      });
    });
  });

  describe("deleteAuthorById", () => {
    test("should delete an author and return 200 status", async () => {
      const mockContext = createMockContext({
        path: { id: "1" },
      });

      vi.mocked(Authors.deleteAuthorById).mockResolvedValue(1);

      await deleteAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.deleteAuthorById).toHaveBeenCalledWith("1");
      expect(mockContext.res.status).toHaveBeenCalledWith(200);
      expect(mockContext.res.end).toHaveBeenCalled();
    });

    test("should return 404 when author to delete is not found", async () => {
      const mockContext = createMockContext({
        path: { id: "999" },
      });

      vi.mocked(Authors.deleteAuthorById).mockResolvedValue(0);

      await deleteAuthorById(mockContext as unknown as ExegesisContext);

      expect(Authors.deleteAuthorById).toHaveBeenCalledWith("999");
      expect(mockContext.res.status).toHaveBeenCalledWith(404);
      expect(mockContext.res.end).toHaveBeenCalled();
    });
  });
});
