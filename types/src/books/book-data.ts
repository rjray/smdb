/**
 * Type declaration for basic book data.
 */

import { PublisherForBook } from "../publishers";
import { SeriesForBook } from "../series";
import { ReferenceData } from "../references";

/**
 * JSON representation of a book record.
 *
 * @property {number} referenceId - The ID of the reference.
 * @property {string|null} [isbn] - The ISBN of the book (optional).
 * @property {string|null} [seriesNumber] - The series number of the book
 * (optional).
 * @property {number|null} [publisherId] - The ID of the publisher (optional).
 * @property {number|null} [seriesId] - The ID of the series (optional).
 * @property {ReferenceData} [reference] - The reference record (optional).
 * @property {PublisherData} [publisher] - The publisher record (optional).
 * @property {SeriesData} [series] - The series record (optional).
 */
export type BookData = {
  referenceId: number;
  isbn: string | null;
  seriesNumber: string | null;
  publisherId: number | null;
  seriesId: number | null;
  reference?: ReferenceData;
  publisher?: PublisherForBook;
  series?: SeriesForBook;
};
