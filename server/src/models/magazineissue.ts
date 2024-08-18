/*
  MagazineIssue model definition.
 */

import {
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  HasMany,
  AllowNull,
} from "sequelize-typescript";

import Magazine, { MagazineRecord } from "./magazine";
import MagazineFeature, { MagazineFeatureRecord } from "./magazinefeature";

export type MagazineIssueRecord = {
  id: number;
  issue: string;
  magazineId: number;
  createdAt: string;
  updatedAt: string;
  magazine?: MagazineRecord;
  magazineFeatures?: Array<MagazineFeatureRecord>;
};

@DefaultScope(() => ({ include: [Magazine] }))
@Scopes(() => ({ full: { include: [MagazineFeature] } }))
@Table
class MagazineIssue extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  issue!: string;

  @ForeignKey(() => Magazine)
  @Column(DataType.INTEGER)
  magazineId!: number;

  @BelongsTo(() => Magazine, { onDelete: "CASCADE" })
  magazine?: Magazine;

  @HasMany(() => MagazineFeature)
  magazineFeatures?: MagazineFeature[];

  clean(): MagazineIssueRecord {
    const result = this.get();

    if (result.magazineFeatures)
      result.magazineFeatures = result.magazineFeatures.map(
        (mf: MagazineFeature) => mf.clean()
      );

    return result;
  }
}

export default MagazineIssue;
