/**
 * Types needed for the Book model beyond the model declaration itself.
 */

import { PublisherForBook } from "./publisher";
import { SeriesForBook } from "./series";

export type BookForReference = {
  isbn?: string | null;
  seriesNumber?: string | null;
  publisherId?: number | null;
  publisher?: PublisherForBook | null;
  seriesId?: number | null;
  series?: SeriesForBook | null;
};
