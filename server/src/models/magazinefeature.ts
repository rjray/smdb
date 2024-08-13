/*
  MagazineFeature model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  ForeignKey,
  PrimaryKey,
  BelongsTo,
  BelongsToMany,
} from "sequelize-typescript";

import FeatureTag from "./featuretag";
import FeatureTagsMagazineFeatures from "./featuretagsmagazinefeatures";
import MagazineIssue from "./magazineissue";
import Reference from "./reference";

@DefaultScope(() => ({
  attributes: ["createdAt", "updatedAt"],
}))
@Table
class MagazineFeature extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference)
  reference?: Reference;

  @ForeignKey(() => MagazineIssue)
  @Column(DataType.INTEGER)
  magazineIssueId!: number;

  @BelongsTo(() => MagazineIssue)
  magazineIssue?: MagazineIssue;

  @BelongsToMany(() => FeatureTag, () => FeatureTagsMagazineFeatures)
  featureTags?: FeatureTag[];
}

export default MagazineFeature;