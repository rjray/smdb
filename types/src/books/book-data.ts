/**
 * Type declaration for basic book data.
 */

import { PublisherForBook } from "../publishers";
import { SeriesForBook } from "../series";

export type BookData = {
  referenceId: number;
  isbn: string | null;
  seriesNumber: string | null;
  publisherId: number | null;
  seriesId: number | null;
  publisher?: PublisherForBook | null;
  series?: SeriesForBook | null;
};
