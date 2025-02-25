/*
  Magazine model definition.
 */

import {
  DataType,
  Scopes,
  Table,
  Column,
  Model,
  HasMany,
  AllowNull,
} from "sequelize-typescript";
import { MagazineData } from "@smdb-types/magazines";

import MagazineIssue from "./magazineissue";

@Scopes(() => ({ issues: { include: [MagazineIssue] } }))
@Table
class Magazine extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  language!: string | null;

  @Column(DataType.STRING)
  aliases!: string | null;

  @Column(DataType.STRING)
  notes!: string | null;

  @Column(DataType.VIRTUAL)
  issueCount?: number;

  @HasMany(() => MagazineIssue)
  issues?: MagazineIssue[];

  clean(): MagazineData {
    const result = { ...this.get() };

    // The two dates are Date objects, convert them to ISO strings so that
    // they don't stringify automatically.
    for (const date of ["createdAt", "updatedAt"]) {
      if (result[date]) result[date] = result[date].toISOString();
    }

    if (result.issues)
      result.issues = result.issues.map((mi: MagazineIssue) => mi.clean());

    return result;
  }
}

export default Magazine;
