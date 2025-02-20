/**
 * Type declaration for new book data.
 */

import { PublisherNewData } from "../publishers";
import { SeriesNewData } from "../series";

export type BookNewData = {
  isbn?: string | null;
  seriesNumber?: string | null;
  publisherId?: number | null;
  publisher?: PublisherNewData | null;
  seriesId?: number | null;
  series?: SeriesNewData | null;
};
