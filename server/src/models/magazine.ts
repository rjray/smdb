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

import MagazineIssue, { MagazineIssueRecord } from "./magazineissue";

export type MagazineRecord = {
  id: number;
  name: string;
  language?: string | null;
  aliases?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  issues?: Array<MagazineIssueRecord>;
};

@Scopes(() => ({ issues: { include: [MagazineIssue] } }))
@Table
class Magazine extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  language?: string | null;

  @Column(DataType.STRING)
  aliases?: string | null;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => MagazineIssue)
  issues?: MagazineIssue[];

  clean(): MagazineRecord {
    const result = this.get();

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
