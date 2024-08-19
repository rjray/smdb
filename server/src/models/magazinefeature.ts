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

import FeatureTag, { FeatureTagRecord } from "./featuretag";
import FeatureTagsMagazineFeatures from "./featuretagsmagazinefeatures";
import MagazineIssue, { MagazineIssueRecord } from "./magazineissue";
import Reference, { ReferenceRecord } from "./reference";

/**
 * JSON representation of a magazine feature record.
 *
 * @property {number} referenceId - The ID of the reference.
 * @property {number} magazineIssueId - The ID of the magazine issue.
 * @property {MagazineIssueRecord} [magazineIssue] - The magazine issue record
 * (optional).
 * @property {ReferenceRecord} [reference] - The reference record (optional).
 * @property {FeatureTagRecord[]} [featureTags] - An array of feature tag
 * records (optional).
 */
export type MagazineFeatureRecord = {
  referenceId: number;
  magazineIssueId: number;
  magazineIssue?: MagazineIssueRecord;
  reference?: ReferenceRecord;
  featureTags?: Array<FeatureTagRecord>;
};

@DefaultScope(() => ({ include: [MagazineIssue, FeatureTag] }))
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

  clean(): MagazineFeatureRecord {
    const result = this.get();
    delete result.FeatureTagsMagazineFeatures;

    if (result.reference) result.reference = result.reference.clean();
    if (result.magazineIssue)
      result.magazineIssue = result.magazineIssue.clean();
    if (result.featureTags)
      result.featureTags = result.featureTags.map((ft: FeatureTag) =>
        ft.clean()
      );

    return result;
  }
}

export default MagazineFeature;
