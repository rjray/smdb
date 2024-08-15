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
import MagazineFeature from "./magazinefeature";

@Scopes(() => ({
  references: { include: [MagazineFeature] },
}))
@Table({ timestamps: false })
class FeatureTag extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  description?: string | null;

  @BelongsToMany(() => MagazineFeature, () => FeatureTagsMagazineFeatures)
  magazineFeatures?: MagazineFeature[];
}

export default FeatureTag;
