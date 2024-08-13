/*
  FeatureTagsMagazineFeatures relational model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  ForeignKey,
} from "sequelize-typescript";

import FeatureTag from "./featuretag";
import MagazineFeature from "./magazinefeature";

@Table({ timestamps: false })
class FeatureTagsMagazineFeatures extends Model {
  @ForeignKey(() => FeatureTag)
  @Column(DataType.INTEGER)
  featureTagId!: number;

  @ForeignKey(() => MagazineFeature)
  @Column(DataType.INTEGER)
  magazineFeatureId!: number;
}

export default FeatureTagsMagazineFeatures;
