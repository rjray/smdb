/**
 * Types needed for the MagazineFeature model beyond the model declaration
 * itself.
 */

import { FeatureTagForReference } from "./featuretag";

export type MagazineFeatureForNewReference = {
  magazineId?: number;
  magazineIssueId?: number;
  featureTags: Array<FeatureTagForReference>;
};

export type MagazineFeatureForUpdateReference = {
  magazineId?: number;
  magazineIssueId?: number;
  featureTags?: Array<FeatureTagForReference>;
};
