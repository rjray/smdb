/**
 * Types needed for the Series model beyond the model declaration itself.
 */

export type SeriesForBook = {
  id?: number;
  name?: string;
  notes?: string;
  publisherId?: number;
};

export type SeriesNewData = {
  id?: number;
  name: string;
  notes?: string;
  publisherId?: number;
};

export type SeriesUpdateData = {
  name?: string;
  notes?: string;
  publisherId?: number;
};
