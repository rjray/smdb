/**
 * Type declaration for book update data.
 */

import { PublisherUpdateData } from "../publishers";
import { SeriesUpdateData } from "../series";

export type BookUpdateData = {
  isbn?: string | null;
  seriesNumber?: string | null;
  publisherId?: number | null;
  publisher?: PublisherUpdateData | null;
  seriesId?: number | null;
  series?: SeriesUpdateData | null;
};
