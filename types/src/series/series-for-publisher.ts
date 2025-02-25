/**
 * Type declaration for series data included in publisher data.
 */

export type SeriesForPublisher = {
  id: number;
  name: string;
  notes: string | null;
  publisherId: number | null;
};
