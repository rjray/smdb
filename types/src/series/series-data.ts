/**
 * Type declaration for basic series data.
 */

import { BookData } from "../books";
import { PublisherForSeries } from "../publishers";

/**
 * JSON representation of a series record.
 *
 * @property {number} id - The ID of the series.
 * @property {string} name - The name of the series.
 * @property {string|null} notes - Additional notes about the series (optional).
 * @property {number|null} publisherId - The ID of the publisher (optional).
 * @property {PublisherForSeries} [publisher] - The publisher record (optional).
 * @property {BookData[]} [books] - An array of book records (optional).
 */
export type SeriesData = {
  id: number;
  name: string;
  notes: string | null;
  publisherId: number | null;
  publisher?: PublisherForSeries | null;
  books?: Array<BookData> | null;
};
