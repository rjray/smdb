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

/**
 * JSON representation of a magazine record.
 *
 * @property {number} id - The unique identifier of the magazine.
 * @property {string} name - The name of the magazine.
 * @property {string|null} language - The language of the magazine (optional).
 * @property {string|null} aliases - The aliases of the magazine (optional).
 * @property {string|null} notes - Additional notes about the magazine
 * (optional).
 * @property {string} createdAt - The timestamp when the magazine record was
 * created.
 * @property {string} updatedAt - The timestamp when the magazine record was
 * last updated.
 * @property {Array<MagazineIssueRecord>} [issues] - An array of magazine issue
 * records (optional).
 */
export type MagazineRecord = {
  id: number;
  name: string;
  language: string | null;
  aliases: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  issueCount?: number;
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

  @Column(DataType.VIRTUAL)
  issueCount?: number;

  @HasMany(() => MagazineIssue)
  issues?: MagazineIssue[];

  clean(): MagazineRecord {
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
