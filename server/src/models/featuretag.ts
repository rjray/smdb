/*
  FeatureTag model definition.
 */

import {
  DataType,
  Scopes,
  Table,
  Column,
  Model,
  BelongsToMany,
  AllowNull,
} from "sequelize-typescript";

import FeatureTagsMagazineFeatures from "./featuretagsmagazinefeatures";
import MagazineFeature, { MagazineFeatureRecord } from "./magazinefeature";

/**
 * JSON representation of a feature tag record.
 *
 * @property {number} id - The ID of the feature tag.
 * @property {string} name - The name of the feature tag.
 * @property {string|undefined} [description] - The description of the feature
 * tag (optional).
 * @property {number|undefined} [referenceCount] - The number of references
 * associated with the feature tag (optional).
 * @property {MagazineFeatureRecord[]} [magazineFeatures] - An array of magazine
 * feature records associated with the feature tag (optional).
 */
export type FeatureTagRecord = {
  id: number;
  name: string;
  description?: string;
  referenceCount?: number;
  magazineFeatures?: Array<MagazineFeatureRecord>;
};

@Scopes(() => ({ references: { include: [MagazineFeature] } }))
@Table({ timestamps: false })
class FeatureTag extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  description?: string | null;

  @BelongsToMany(() => MagazineFeature, () => FeatureTagsMagazineFeatures)
  magazineFeatures?: MagazineFeature[];

  clean(): FeatureTagRecord {
    const result = this.get();
    delete result.FeatureTagsMagazineFeatures;

    if (result.magazineFeatures)
      result.magazineFeatures = result.magazineFeatures.map(
        (mf: MagazineFeature) => mf.clean()
      );

    return result;
  }
}

export default FeatureTag;
