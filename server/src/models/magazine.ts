/*
  Magazine model definition.
 */

import {
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  HasMany,
} from "sequelize-typescript";

import MagazineIssue from "./magazineissue";

@DefaultScope(() => ({
  attributes: [
    "id",
    "name",
    "language",
    "aliases",
    "notes",
    "createdAt",
    "updatedAt",
  ],
}))
@Scopes(() => ({
  withIssues: { include: [MagazineIssue] },
}))
@Table
class Magazine extends Model {
  @Column({ allowNull: false })
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
