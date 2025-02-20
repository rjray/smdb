/**
 * Type declaration for basic magazine feature data.
 */

import { FeatureTagForReference } from "../feature-tags";
import { MagazineIssueForReference } from "../magazine-issues";
import { ReferenceData } from "../references";

export type MagazineFeatureData = {
  referenceId: number;
  magazineIssueId: number;
  magazineIssue?: MagazineIssueForReference;
  reference?: ReferenceData;
  featureTags?: Array<FeatureTagForReference>;
};
