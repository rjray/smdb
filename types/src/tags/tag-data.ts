/**
 * Type declaration for basic tag data.
 */

import { ReferenceData } from "../references";

/**
 * JSON representation of a tag record.
 *
 * @property {number} id - The ID of the tag.
 * @property {string} name - The name of the tag.
 * @property {string|null} type - The type of the tag (optional).
 * @property {string|null} description - The description of the tag (optional).
 * @property {number} [referenceCount] - The count of references to the tag
 * (optional).
 * @property {ReferenceData[]} [references] - An array of reference records
 * (optional).
 */
export type TagData = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  referenceCount?: number;
  references?: Array<ReferenceData>;
};
