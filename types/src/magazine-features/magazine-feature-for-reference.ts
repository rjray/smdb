/**
 * Type declaration for basic magazine feature data that is included in a
 * reference record.
 */

import { FeatureTagForReference } from "../feature-tags";
import { MagazineIssueForReference } from "../magazine-issues";

export type MagazineFeatureForReference = {
  referenceId: number;
  magazineIssueId: number;
  magazineIssue?: MagazineIssueForReference;
  featureTags?: Array<FeatureTagForReference>;
};
