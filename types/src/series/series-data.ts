/**
 * Type declaration for basic series data.
 */

import { BookData } from "../books";
import { PublisherForSeries } from "../publishers";

export type SeriesData = {
  id: number;
  name: string;
  notes: string | null;
  publisherId: number | null;
  publisher?: PublisherForSeries | null;
  books?: Array<BookData> | null;
};
