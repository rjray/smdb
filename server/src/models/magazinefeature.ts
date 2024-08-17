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
  attributes: ["magazineIssueId"],
  include: [MagazineIssue, FeatureTag],
}))
@Table({ timestamps: false })
class MagazineFeature extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference, { onDelete: "CASCADE" })
  reference?: Reference;

  @ForeignKey(() => MagazineIssue)
  @Column(DataType.INTEGER)
  magazineIssueId!: number;

  @BelongsTo(() => MagazineIssue, { onDelete: "CASCADE" })
  magazineIssue?: MagazineIssue;

  @BelongsToMany(() => FeatureTag, () => FeatureTagsMagazineFeatures)
  featureTags?: FeatureTag[];

  clean() {
    const result = this.get();
    delete result.magazineIssueId;

    for (const field of ["reference", "magazineIssue"]) {
      if (result[field]) result[field] = result[field].clean();
    }

    if (result.featureTags)
      result.featureTags = result.featureTags.map((ft: FeatureTag) =>
        ft.clean()
      );

    return result;
  }
}

export default MagazineFeature;
