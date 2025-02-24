/**
 * Type declaration for reference data.
 */

import { AuthorForReference } from "../authors";
import { BookData } from "../books";
import { MagazineFeatureForReference } from "../magazine-features";
import { PhotoCollectionData } from "../photo-collections";
import { ReferenceTypeData } from "../reference-types";
import { TagForReference } from "../tags";

/**
 * JSON representation of a reference record.
 *
 * @property {number} id - The ID of the reference.
 * @property {string} name - The name of the reference.
 * @property {string|null} language - The language of the reference (optional).
 * @property {number} referenceTypeId - The ID of the reference type.
 * @property {ReferenceTypeData} [referenceType] - The reference type record.
 * (optional).
 * @property {string} createdAt - The creation date of the reference.
 * @property {string} updatedAt - The last update date of the reference.
 * @property {AuthorData[]} [authors] - An array of author records (optional).
 * @property {TagData[]} [tags] - An array of tag records (optional).
 * @property {BookData} [book] - The book record (optional).
 * @property {MagazineFeatureForReference} [magazineFeature] - The magazine
 * feature record (optional).
 * @property {PhotoCollectionData} [photoCollection] - The photo collection
 * record (optional).
 */
export type ReferenceData = {
  id: number;
  name: string;
  language: string | null;
  referenceTypeId: number;
  referenceType?: ReferenceTypeData;
  createdAt: string;
  updatedAt: string;
  authors?: Array<AuthorForReference>;
  tags?: Array<TagForReference>;
  book?: BookData;
  magazineFeature?: MagazineFeatureForReference;
  photoCollection?: PhotoCollectionData;
};
