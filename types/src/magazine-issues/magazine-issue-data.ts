/**
 * Type declaration for basic magazine issue data.
 */

import { MagazineFeatureForReference } from "../magazine-features";
import { MagazineForReference } from "../magazines";

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
