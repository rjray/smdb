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

  clean() {
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
