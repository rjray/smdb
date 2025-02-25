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
import { MagazineIssueData } from "@smdb-types/magazine-issues";

import Magazine from "./magazine";
import MagazineFeature from "./magazinefeature";

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

  clean(): MagazineIssueData {
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
