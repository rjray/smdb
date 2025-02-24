/**
 * Type declaration for basic photo collection data.
 */

import { ReferenceData } from "../references";

/**
 * JSON representation of a photo collection record.
 *
 * @property {number} referenceId - The ID of the reference associated with the
 * photo collection.
 * @property {string} location - The location of the photo collection.
 * @property {string} media - The media of the photo collection.
 * @property {ReferenceData} [reference] - The reference record associated
 * with the photo collection (optional).
 */
export type PhotoCollectionData = {
  refereceId: string;
  location: string;
  media: string;
  reference?: ReferenceData;
};
