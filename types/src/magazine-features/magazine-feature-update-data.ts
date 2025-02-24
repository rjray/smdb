/**
 * Type declaration for updating a magazine feature.
 */

import { FeatureTagUpdateData } from "../feature-tags";
import { MagazineIssueUpdateData } from "../magazine-issues";
import { MagazineNewData } from "../magazines";

export type MagazineFeatureUpdateData = {
  referenceId?: number;
  magazineIssueId?: number;
  magazineIssue?: MagazineIssueUpdateData;
  magazineId?: number;
  magazine?: MagazineNewData;
  featureTags?: Array<FeatureTagUpdateData>;
};
