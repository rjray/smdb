/**
 * Type declaration for basic publisher data.
 */

import { BookData } from "../books";
import { SeriesForPublisher } from "../series";

export type PublisherData = {
  id: number;
  name: string;
  notes: string | null;
  books?: Array<BookData> | null;
  series?: Array<SeriesForPublisher> | null;
};
