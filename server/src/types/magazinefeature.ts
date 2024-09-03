/**
 * Types needed for the MagazineFeature model beyond the model declaration
 * itself.
 */

import { FeatureTagForReference } from "./featuretag";
import {
  MagazineForNewReference,
  MagazineForUpdateReference,
} from "./magazine";
import {
  MagazineIssueForNewReference,
  MagazineIssueForUpdateReference,
} from "./magazineissue";

export type MagazineFeatureForNewReference = {
  magazineId?: number;
  magazine?: MagazineForNewReference;
  magazineIssueId?: number;
  magazineIssue?: MagazineIssueForNewReference;
  featureTags: Array<FeatureTagForReference>;
};

export type MagazineFeatureForUpdateReference = {
  magazineId?: number;
  magazine?: MagazineForUpdateReference;
  magazineIssueId?: number;
  magazineIssue?: MagazineIssueForUpdateReference;
  featureTags?: Array<FeatureTagForReference>;
};
