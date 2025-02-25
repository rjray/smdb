/**
 * Type declaration for series data included in book data.
 */

export type SeriesForBook = {
  id: number;
  name: string;
  notes: string | null;
  publisherId: number | null;
};
