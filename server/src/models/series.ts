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
} from "sequelize-typescript";

import Book from "./book";
import Publisher from "./publisher";

@DefaultScope(() => ({
  attributes: ["id", "name", "notes"],
  include: [Publisher],
}))
@Table({ timestamps: false })
class Series extends Model {
  @Column({ allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @ForeignKey(() => Publisher)
  @Column
  publisherId?: number;

  @BelongsTo(() => Publisher)
  publisher?: Publisher;

  @HasMany(() => Book)
  books?: Book[];
}

export default Series;
