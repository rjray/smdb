/**
 * Type declaration for feature tag data.
 */

import { MagazineFeatureForReference } from "../magazine-features";

export type FeatureTagRecord = {
  id: number;
  name: string;
  description: string | null;
  referenceCount?: number;
  magazineFeatures?: Array<MagazineFeatureForReference>;
};
