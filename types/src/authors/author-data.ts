/**
 * Type declaration for basic author data.
 */

import { AuthorAliasData } from "../author-aliases";
import { ReferenceData } from "../references";

/**
 * JSON representation of an author record.
 *
 * @property {number} id - The unique identifier of the author.
 * @property {string} name - The name of the author.
 * @property {string} createdAt - The date and time when the author record was
 * created.
 * @property {string} updatedAt - The date and time when the author record was
 * last updated.
 * @property {number} [referenceCount] - The number of references associated
 * with the author (optional).
 * @property {Array<AuthorAliasRecord>} [aliases] - An array of author alias
 * records associated with the author (optional).
 * @property {Array<ReferenceRecord>} [references] - An array of reference
 * records associated with the author (optional).
 */
export type AuthorData = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  aliases?: Array<AuthorAliasData>;
  referenceCount?: number;
  references?: Array<ReferenceData>;
};
