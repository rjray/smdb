/*
  MagazineIssue model definition.
 */

import {
  DataType,
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

/**
 * JSON representation of a magazine issue record.
 *
 * @property {number} id - The ID of the magazine issue.
 * @property {string} issue - The issue of the magazine.
 * @property {number} magazineId - The ID of the magazine.
 * @property {string} createdAt - The creation date of the magazine issue.
 * @property {string} updatedAt - The last update date of the magazine issue.
 * @property {MagazineRecord} [magazine] - The magazine record (optional).
 * @property {MagazineFeatureRecord[]} [magazineFeatures] - An array of magazine
 * feature records (optional).
 */
export type MagazineIssueRecord = {
  id: number;
  issue: string;
  magazineId: number;
  createdAt: string;
  updatedAt: string;
  referenceCount?: number;
  magazine?: MagazineRecord;
  magazineFeatures?: Array<MagazineFeatureRecord>;
};

@Scopes(() => ({
  magazine: { include: [Magazine] },
  features: { include: [MagazineFeature] },
}))
@Table
class MagazineIssue extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  issue!: string;

  @ForeignKey(() => Magazine)
  @Column(DataType.INTEGER)
  magazineId!: number;

  @Column(DataType.VIRTUAL)
  referenceCount?: number;

  @BelongsTo(() => Magazine, { onDelete: "CASCADE" })
  magazine?: Magazine;

  @HasMany(() => MagazineFeature)
  magazineFeatures?: MagazineFeature[];

  clean(): MagazineIssueRecord {
    const result = { ...this.get() };

    // The two dates are Date objects, convert them to ISO strings so that
    // they don't stringify automatically.
    for (const date of ["createdAt", "updatedAt"]) {
      if (result[date]) result[date] = result[date].toISOString();
    }

    if (result.magazine) result.magazine = result.magazine.clean();
    if (result.magazineFeatures)
      result.magazineFeatures = result.magazineFeatures.map(
        (mf: MagazineFeature) => mf.clean()
      );

    return result;
  }
}

export default MagazineIssue;
