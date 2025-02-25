/**
 * Type declaration for feature tag data.
 */

import { MagazineFeatureForReference } from "../magazine-features";

/**
 * JSON representation of a feature tag record.
 *
 * @property {number} id - The ID of the feature tag.
 * @property {string} name - The name of the feature tag.
 * @property {string|null} description - The description of the feature
 * tag (optional).
 * @property {number} [referenceCount] - The number of references associated
 * with the feature tag (optional).
 * @property {MagazineFeatureForReference[]} [magazineFeatures] - An array of
 * magazine feature records associated with the feature tag (optional).
 */
export type FeatureTagData = {
  id: number;
  name: string;
  description: string | null;
  referenceCount?: number;
  magazineFeatures?: Array<MagazineFeatureForReference>;
};
