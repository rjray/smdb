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

import MagazineIssue from "./magazineissue";

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
}

export default Magazine;
