/**
 * Test suite for the controller functions in the `controllers/publishersController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";
import { PublisherData } from "@smdb-types/publishers";

import { Publisher, Book, Series } from "../../src/models";
import { Publishers } from "../../src/db";
import * as publishersController from "../../src/controllers/publishersController";

// Mock the Publishers database module
vi.mock("../../src/db", () => ({
  Publishers: {
    createPublisher: vi.fn(),
    getAllPublishers: vi.fn(),
    getPublisherById: vi.fn(),
    updatePublisherById: vi.fn(),
    deletePublisherById: vi.fn(),
  },
}));

// Helper to create a mock publisher
const createMockPublisher = (
  id: number,
  name: string,
  options: {
    books?: Partial<Book>[];
    series?: Partial<Series>[];
  } = {}
): Publisher => {
  const { books = undefined, series = undefined } = options;

  return {
    id,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    books,
    series,
    clean: () => {
      const result: PublisherData = { id, name, notes: null };

      if (books) {
        const booklist = [];
        for (const book of books) {
          if (book.clean && typeof book.clean === "function")
            booklist.push(book.clean());
        }

        result.books = booklist;
      }
      if (series) {
        const serieslist = [];
        for (const ser of series) {
          if (ser.clean && typeof ser.clean === "function")
            serieslist.push(ser.clean());
        }

        result.series = serieslist;
      }

      return result;
    },
  } as Publisher;
};

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

beforeEach(() => {
  vi.resetAllMocks();
});

describe("publishersController: createPublisher", () => {
  test("should create a publisher and return 201 status", async () => {
    const mockPublisher = createMockPublisher(1, "Test Publisher");
    const mockContext = createMockContext({
      requestBody: { name: "Test Publisher" },
    });

    vi.mocked(Publishers.createPublisher).mockResolvedValue(mockPublisher);

    await publishersController.createPublisher(mockContext);

    expect(Publishers.createPublisher).toHaveBeenCalledWith({
      name: "Test Publisher",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Test Publisher",
      notes: null,
    });
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { name: "Test Publisher" },
    });

    const error = new Error("Database error");
    vi.mocked(Publishers.createPublisher).mockRejectedValue(error);

    await expect(
      publishersController.createPublisher(mockContext)
    ).rejects.toThrow("Database error");
  });
});

describe("publishersController: getAllPublishers", () => {
  test("should return all publishers with 200 status", async () => {
    const mockPublishers = [
      createMockPublisher(1, "Publisher 1"),
      createMockPublisher(2, "Publisher 2"),
    ];
    const mockContext = createMockContext();

    vi.mocked(Publishers.getAllPublishers).mockResolvedValue(mockPublishers);

    await publishersController.getAllPublishers(mockContext);

    expect(Publishers.getAllPublishers).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      { id: 1, name: "Publisher 1", notes: null },
      { id: 2, name: "Publisher 2", notes: null },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockBook = {
      referenceId: 1,
      isbn: null,
      seriesNumber: null,
      publisherId: 1,
      seriesId: null,
      title: "Sample Book",
      clean: () => ({
        referenceId: 1,
        isbn: null,
        seriesNumber: null,
        publisherId: 1,
        seriesId: null,
        title: "Sample Book",
      }),
    };

    const mockPublishers = [
      createMockPublisher(1, "Publisher 1", { books: [mockBook] }),
    ];

    const mockContext = createMockContext({
      query: { books: true },
    });

    vi.mocked(Publishers.getAllPublishers).mockResolvedValue(mockPublishers);

    await publishersController.getAllPublishers(mockContext);

    expect(Publishers.getAllPublishers).toHaveBeenCalledWith({
      books: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Publisher 1",
        notes: null,
        books: [mockBook.clean()],
      },
    ]);
  });

  test("should handle empty result set", async () => {
    const mockPublishers: Publisher[] = [];
    const mockContext = createMockContext();

    vi.mocked(Publishers.getAllPublishers).mockResolvedValue(mockPublishers);

    await publishersController.getAllPublishers(mockContext);

    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([]);
  });
});

describe("publishersController: getPublisherById", () => {
  test("should return a publisher with 200 status when found", async () => {
    const mockPublisher = createMockPublisher(1, "Publisher 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Publishers.getPublisherById).mockResolvedValue(mockPublisher);

    await publishersController.getPublisherById(mockContext);

    expect(Publishers.getPublisherById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Publisher 1",
      notes: null,
    });
  });

  test("should return 404 status when publisher not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Publishers.getPublisherById).mockResolvedValue(null);

    await publishersController.getPublisherById(mockContext);

    expect(Publishers.getPublisherById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const mockSeries = {
      id: 1,
      name: "Sample Series",
      notes: null,
      publisherId: 1,
      clean: () => ({
        id: 1,
        name: "Sample Series",
        notes: null,
        publisherId: 1,
      }),
    };

    const mockPublisher = createMockPublisher(1, "Publisher 1", {
      series: [mockSeries],
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      query: { series: true },
    });

    vi.mocked(Publishers.getPublisherById).mockResolvedValue(mockPublisher);

    await publishersController.getPublisherById(mockContext);

    expect(Publishers.getPublisherById).toHaveBeenCalledWith(1, {
      series: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Publisher 1",
      notes: null,
      series: [{ id: 1, name: "Sample Series", notes: null, publisherId: 1 }],
    });
  });

  test("should handle string IDs correctly", async () => {
    const mockPublisher = createMockPublisher(1, "Publisher 1");
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(Publishers.getPublisherById).mockResolvedValue(mockPublisher);

    await publishersController.getPublisherById(mockContext);

    expect(Publishers.getPublisherById).toHaveBeenCalledWith("1", {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});

describe("publishersController: updatePublisherById", () => {
  test("should update a publisher and return 200 status when found", async () => {
    const mockPublisher = createMockPublisher(1, "Updated Publisher");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Publisher" },
    });

    vi.mocked(Publishers.updatePublisherById).mockResolvedValue(mockPublisher);

    await publishersController.updatePublisherById(mockContext);

    expect(Publishers.updatePublisherById).toHaveBeenCalledWith(1, {
      name: "Updated Publisher",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Publisher",
      notes: null,
    });
  });

  test("should return 404 status when publisher not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Publisher" },
    });

    vi.mocked(Publishers.updatePublisherById).mockResolvedValue(null);

    await publishersController.updatePublisherById(mockContext);

    expect(Publishers.updatePublisherById).toHaveBeenCalledWith(999, {
      name: "Updated Publisher",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data", async () => {
    const mockPublisher = createMockPublisher(1, "Updated Publisher");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        name: "Updated Publisher",
        notes: "Important publisher",
        website: "https://example.com",
      },
    });

    vi.mocked(Publishers.updatePublisherById).mockResolvedValue(mockPublisher);

    await publishersController.updatePublisherById(mockContext);

    expect(Publishers.updatePublisherById).toHaveBeenCalledWith(1, {
      name: "Updated Publisher",
      notes: "Important publisher",
      website: "https://example.com",
    });
  });
});

describe("publishersController: deletePublisherById", () => {
  test("should delete a publisher and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(Publishers.deletePublisherById).mockResolvedValue(1);

    await publishersController.deletePublisherById(mockContext);

    expect(Publishers.deletePublisherById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when publisher not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(Publishers.deletePublisherById).mockResolvedValue(0);

    await publishersController.deletePublisherById(mockContext);

    expect(Publishers.deletePublisherById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
