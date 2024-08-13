/*
  Series model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  HasMany,
  BelongsTo,
  ForeignKey,
  AllowNull,
} from "sequelize-typescript";

import Book from "./book";
import Publisher from "./publisher";

@DefaultScope(() => ({
  attributes: ["id", "name", "notes"],
  include: [Publisher],
}))
@Table({ timestamps: false })
class Series extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @ForeignKey(() => Publisher)
  @Column(DataType.INTEGER)
  publisherId?: number;

  @BelongsTo(() => Publisher)
  publisher?: Publisher;

  @HasMany(() => Book)
  books?: Book[];
}

export default Series;
