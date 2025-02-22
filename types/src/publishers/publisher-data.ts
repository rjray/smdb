/**
 * Type declaration for basic publisher data.
 */

import { BookData } from "../books";
import { SeriesForPublisher } from "../series";

/**
 * JSON representation of a publisher record.
 *
 * @property {number} id - The ID of the publisher.
 * @property {string} name - The name of the publisher.
 * @property {string|null} notes - Additional notes about the publisher
 * (optional).
 * @property {BookData[]} [books] - An array of book records associated with
 * the publisher (optional).
 * @property {SeriesForPublisher[]} [series] - An array of series records
 * associated with the publisher (optional).
 */
export type PublisherData = {
  id: number;
  name: string;
  notes: string | null;
  books?: Array<BookData>;
  series?: Array<SeriesForPublisher>;
};
