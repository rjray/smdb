/**
 * Type declaration for reference type data.
 */

import { ReferenceData } from "../references";

/**
 * JSON representation of a reference type record.
 *
 * @property {number} id - The ID of the reference type.
 * @property {string} name - The name of the reference type.
 * @property {string} description - The description of the reference type.
 * @property {string|null} notes - Additional notes about the reference type
 * (optional).
 * @property {number} [referenceCount] - The number of references associated
 * with the reference type (optional).
 * @property {ReferenceData[]} [references] - An array of reference records
 * associated with the reference type (optional).
 */
export type ReferenceTypeData = {
  id: number;
  name: string;
  description: string;
  notes: string | null;
  referenceCount?: number;
  references?: Array<ReferenceData>;
};
