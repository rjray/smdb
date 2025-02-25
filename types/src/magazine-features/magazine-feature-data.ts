/**
 * Type declaration for basic magazine feature data.
 */

import { FeatureTagForReference } from "../feature-tags";
import { MagazineIssueForReference } from "../magazine-issues";
import { ReferenceData } from "../references";

/**
 * JSON representation of a magazine feature record.
 *
 * @property {number} referenceId - The ID of the reference.
 * @property {number} magazineIssueId - The ID of the magazine issue.
 * @property {MagazineIssueRecord} [magazineIssue] - The magazine issue record
 * (optional).
 * @property {ReferenceData} [reference] - The reference record (optional).
 * @property {FeatureTagForReference[]} [featureTags] - An array of feature tag
 * records (optional).
 */
export type MagazineFeatureData = {
  referenceId: number;
  magazineIssueId: number;
  magazineIssue?: MagazineIssueForReference;
  reference?: ReferenceData;
  featureTags?: Array<FeatureTagForReference>;
};
