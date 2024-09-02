/**
 * Types needed for the Book model beyond the model declaration itself.
 */

export type BookForReference = {
  isbn?: string;
  seriesNumber?: string;
  publisherId?: number;
  seriesId?: number;
};
