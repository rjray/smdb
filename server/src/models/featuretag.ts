/*
  FeatureTag model definition.
 */

import {
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  BelongsToMany,
} from "sequelize-typescript";

import FeatureTagsMagazineFeatures from "./featuretagsmagazinefeatures";
import MagazineFeature from "./magazinefeature";

@DefaultScope(() => ({
  attributes: ["id", "name", "description"],
}))
@Scopes(() => ({
  references: { include: [MagazineFeature] },
}))
@Table({ timestamps: false })
class FeatureTag extends Model {
  @Column({ allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  description?: string | null;

  @BelongsToMany(() => MagazineFeature, () => FeatureTagsMagazineFeatures)
  magazineFeatures?: MagazineFeature[];
}

export default FeatureTag;
