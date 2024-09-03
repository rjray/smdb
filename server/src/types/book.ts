/**
 * Types needed for the Book model beyond the model declaration itself.
 */

import { PublisherForBook } from "./publisher";
import { SeriesForBook } from "./series";

export type BookForReference = {
  isbn?: string;
  seriesNumber?: string;
  publisherId?: number;
  publisher?: PublisherForBook;
  seriesId?: number;
  series?: SeriesForBook;
};
