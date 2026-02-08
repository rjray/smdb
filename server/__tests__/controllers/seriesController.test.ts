/**
 * Test suite for the controller functions in the `controllers/seriesController.ts` module.
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { ExegesisContext } from "exegesis-express";
import { SeriesData } from "@smdb-types/series";

import { Series, Publisher, Book } from "../../src/models";
import { Series as SeriesDB } from "../../src/db";
import * as seriesController from "../../src/controllers/seriesController";

// Mock the Series database module
vi.mock("../../src/db", () => ({
  Series: {
    createSeries: vi.fn(),
    getAllSeries: vi.fn(),
    getSeriesById: vi.fn(),
    updateSeriesById: vi.fn(),
    deleteSeriesById: vi.fn(),
  },
}));

// Helper to create a mock series
const createMockSeries = (
  id: number,
  name: string,
  options: {
    publisherId?: number;
    publisher?: Partial<Publisher>;
    books?: Partial<Book>[];
  } = {}
): Series => {
  const { publisher, books } = options;
  const publisherId = options.publisherId ?? null;

  return {
    id,
    name,
    publisherId,
    publisher,
    books,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    clean: () => {
      const result: SeriesData = { id, publisherId, name, notes: null };

      if (publisher && publisher.clean) {
        result.publisher = publisher.clean();
      }
      if (books) {
        const booklist = [];
        for (const book of books) {
          if (book.clean && typeof book.clean === "function")
            booklist.push(book.clean());
        }

        result.books = booklist;
      }
      return result;
    },
  } as Series;
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

describe("seriesController: createSeries", () => {
  test("should create a series and return 201 status", async () => {
    const mockSeries = createMockSeries(1, "Test Series");
    const mockContext = createMockContext({
      requestBody: { name: "Test Series" },
    });

    vi.mocked(SeriesDB.createSeries).mockResolvedValue(mockSeries);

    await seriesController.createSeries(mockContext);

    expect(SeriesDB.createSeries).toHaveBeenCalledWith({
      name: "Test Series",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Test Series",
      notes: null,
      publisherId: null,
    });
  });

  test("should create a series with publisher and return 201 status", async () => {
    const mockSeries = createMockSeries(1, "Test Series", { publisherId: 1 });
    const mockContext = createMockContext({
      requestBody: { name: "Test Series", publisherId: 1 },
    });

    vi.mocked(SeriesDB.createSeries).mockResolvedValue(mockSeries);

    await seriesController.createSeries(mockContext);

    expect(SeriesDB.createSeries).toHaveBeenCalledWith({
      name: "Test Series",
      publisherId: 1,
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(201);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Test Series",
      publisherId: 1,
      notes: null,
    });
  });

  test("should propagate errors from the database layer", async () => {
    const mockContext = createMockContext({
      requestBody: { name: "Test Series" },
    });

    const error = new Error("Database error");
    vi.mocked(SeriesDB.createSeries).mockRejectedValue(error);

    await expect(seriesController.createSeries(mockContext)).rejects.toThrow(
      "Database error"
    );
  });
});

describe("seriesController: getAllSeries", () => {
  test("should return all series with 200 status", async () => {
    const mockSeries = [
      createMockSeries(1, "Series 1"),
      createMockSeries(2, "Series 2"),
    ];
    const mockContext = createMockContext();

    vi.mocked(SeriesDB.getAllSeries).mockResolvedValue(mockSeries);

    await seriesController.getAllSeries(mockContext);

    expect(SeriesDB.getAllSeries).toHaveBeenCalledWith({});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      { id: 1, name: "Series 1", notes: null, publisherId: null },
      { id: 2, name: "Series 2", notes: null, publisherId: null },
    ]);
  });

  test("should pass query parameters to the database layer", async () => {
    const mockBook = {
      referenceId: 1,
      isbn: null,
      seriesNumber: "1",
      publisherId: 1,
      seriesId: 1,
      title: "Sample Book",
      clean: () => ({
        referenceId: 1,
        isbn: null,
        seriesNumber: "1",
        publisherId: 1,
        seriesId: 1,
        title: "Sample Book",
      }),
    };

    const mockSeries = [createMockSeries(1, "Series 1", { books: [mockBook] })];

    const mockContext = createMockContext({
      query: { books: true },
    });

    vi.mocked(SeriesDB.getAllSeries).mockResolvedValue(mockSeries);

    await seriesController.getAllSeries(mockContext);

    expect(SeriesDB.getAllSeries).toHaveBeenCalledWith({
      books: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([
      {
        id: 1,
        name: "Series 1",
        notes: null,
        publisherId: null,
        books: [mockBook.clean()],
      },
    ]);
  });

  test("should handle empty result set", async () => {
    const mockSeries: Series[] = [];
    const mockContext = createMockContext();

    vi.mocked(SeriesDB.getAllSeries).mockResolvedValue(mockSeries);

    await seriesController.getAllSeries(mockContext);

    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith([]);
  });
});

describe("seriesController: getSeriesById", () => {
  test("should return a series with 200 status when found", async () => {
    const mockSeries = createMockSeries(1, "Series 1");
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(SeriesDB.getSeriesById).mockResolvedValue(mockSeries);

    await seriesController.getSeriesById(mockContext);

    expect(SeriesDB.getSeriesById).toHaveBeenCalledWith(1, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Series 1",
      notes: null,
      publisherId: null,
    });
  });

  test("should return 404 status when series not found", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(SeriesDB.getSeriesById).mockResolvedValue(null);

    await seriesController.getSeriesById(mockContext);

    expect(SeriesDB.getSeriesById).toHaveBeenCalledWith(999, {});
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should pass query parameters to the database layer", async () => {
    const now = new Date();

    const mockPublisher = {
      id: 1,
      name: "Sample Publisher",
      notes: null,
      createdAt: now,
      updatedAt: now,
      clean: () => ({
        id: 1,
        name: "Sample Publisher",
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    };

    const mockSeries = createMockSeries(1, "Series 1", {
      publisher: mockPublisher,
      publisherId: mockPublisher.id,
    });

    const mockContext = createMockContext({
      path: { id: 1 },
      query: { publisher: true },
    });

    vi.mocked(SeriesDB.getSeriesById).mockResolvedValue(mockSeries);

    await seriesController.getSeriesById(mockContext);

    expect(SeriesDB.getSeriesById).toHaveBeenCalledWith(1, {
      publisher: true,
    });
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Series 1",
      notes: null,
      publisherId: 1,
      publisher: {
        id: 1,
        name: "Sample Publisher",
        notes: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
  });

  test("should handle string IDs correctly", async () => {
    const mockSeries = createMockSeries(1, "Series 1");
    const mockContext = createMockContext({
      path: { id: "1" },
    });

    vi.mocked(SeriesDB.getSeriesById).mockResolvedValue(mockSeries);

    await seriesController.getSeriesById(mockContext);

    expect(SeriesDB.getSeriesById).toHaveBeenCalledWith("1", {});
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
  });
});

describe("seriesController: updateSeriesById", () => {
  test("should update a series and return 200 status when found", async () => {
    const mockSeries = createMockSeries(1, "Updated Series");
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: { name: "Updated Series" },
    });

    vi.mocked(SeriesDB.updateSeriesById).mockResolvedValue(mockSeries);

    await seriesController.updateSeriesById(mockContext);

    expect(SeriesDB.updateSeriesById).toHaveBeenCalledWith(1, {
      name: "Updated Series",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.pureJson).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Series",
      notes: null,
      publisherId: null,
    });
  });

  test("should return 404 status when series not found for update", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
      requestBody: { name: "Updated Series" },
    });

    vi.mocked(SeriesDB.updateSeriesById).mockResolvedValue(null);

    await seriesController.updateSeriesById(mockContext);

    expect(SeriesDB.updateSeriesById).toHaveBeenCalledWith(999, {
      name: "Updated Series",
    });
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should handle complex update data", async () => {
    const mockSeries = createMockSeries(1, "Updated Series", {
      publisherId: 2,
    });
    const mockContext = createMockContext({
      path: { id: 1 },
      requestBody: {
        name: "Updated Series",
        publisherId: 2,
        notes: "Important series",
      },
    });

    vi.mocked(SeriesDB.updateSeriesById).mockResolvedValue(mockSeries);

    await seriesController.updateSeriesById(mockContext);

    expect(SeriesDB.updateSeriesById).toHaveBeenCalledWith(1, {
      name: "Updated Series",
      publisherId: 2,
      notes: "Important series",
    });
  });
});

describe("seriesController: deleteSeriesById", () => {
  test("should delete a series and return 200 status when found", async () => {
    const mockContext = createMockContext({
      path: { id: 1 },
    });

    vi.mocked(SeriesDB.deleteSeriesById).mockResolvedValue(1);

    await seriesController.deleteSeriesById(mockContext);

    expect(SeriesDB.deleteSeriesById).toHaveBeenCalledWith(1);
    expect(mockContext.res.status).toHaveBeenCalledWith(200);
    expect(mockContext.res.end).toHaveBeenCalled();
  });

  test("should return 404 status when series not found for deletion", async () => {
    const mockContext = createMockContext({
      path: { id: 999 },
    });

    vi.mocked(SeriesDB.deleteSeriesById).mockResolvedValue(0);

    await seriesController.deleteSeriesById(mockContext);

    expect(SeriesDB.deleteSeriesById).toHaveBeenCalledWith(999);
    expect(mockContext.res.status).toHaveBeenCalledWith(404);
    expect(mockContext.res.end).toHaveBeenCalled();
  });
});
