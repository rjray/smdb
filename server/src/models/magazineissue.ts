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
} from "sequelize-typescript";

import Magazine from "./magazine";
import MagazineFeature from "./magazinefeature";

@DefaultScope(() => ({
  attributes: ["id", "issue", "createdAt", "updatedAt"],
}))
@Scopes(() => ({
  full: { include: [MagazineFeature] },
}))
@Table
class MagazineIssue extends Model {
  @Column({ allowNull: false })
  issue!: string;

  @ForeignKey(() => Magazine)
  @Column(DataType.INTEGER)
  magazineId!: number;

  @BelongsTo(() => Magazine)
  magazine?: Magazine;

  @HasMany(() => MagazineFeature)
  magazineFeatures?: MagazineFeature[];
}

export default MagazineIssue;
