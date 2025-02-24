/**
 * Type declaration for creating a new magazine feature.
 */

import { FeatureTagNewData } from "../feature-tags";
import { MagazineIssueNewData } from "../magazine-issues";
import { MagazineNewData } from "../magazines";

export type MagazineFeatureNewData = {
  referenceId?: number;
  magazineIssueId?: number;
  magazineIssue?: MagazineIssueNewData;
  magazineId?: number;
  magazine?: MagazineNewData;
  featureTags: Array<FeatureTagNewData>;
};
