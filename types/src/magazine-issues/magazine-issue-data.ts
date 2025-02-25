/**
 * Type declaration for basic magazine issue data.
 */

import { MagazineFeatureForReference } from "../magazine-features";
import { MagazineForReference } from "../magazines";

/**
 * JSON representation of a magazine issue record.
 *
 * @property {number} id - The ID of the magazine issue.
 * @property {string} issue - The issue of the magazine.
 * @property {number} magazineId - The ID of the magazine.
 * @property {string} createdAt - The creation date of the magazine issue.
 * @property {string} updatedAt - The last update date of the magazine issue.
 * @property {number|null} [referenceCount] - The number of references
 * associated with the magazine issue (optional).
 * @property {MagazineRecord} [magazine] - The magazine record (optional).
 * @property {MagazineFeatureRecord[]} [magazineFeatures] - An array of magazine
 * feature records (optional).
 */
export type MagazineIssueData = {
  id: number;
  issue: string;
  magazineId: number;
  createdAt: string;
  updatedAt: string;
  referenceCount?: number;
  magazine?: MagazineForReference;
  magazineFeatures?: Array<MagazineFeatureForReference>;
};
