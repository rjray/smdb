/*
  Book model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
} from "sequelize-typescript";

import Publisher from "./publisher";
import Reference from "./reference";
import Series from "./series";

@DefaultScope(() => ({
  attributes: ["isbn", "seriesNumber"],
  include: [Publisher, Series],
}))
@Table({ timestamps: false })
class Book extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference)
  reference?: Reference;

  @Column(DataType.STRING)
  isbn?: string | null;

  @Column(DataType.STRING)
  seriesNumber?: string | null;

  @ForeignKey(() => Publisher)
  @Column(DataType.INTEGER)
  publisherId?: number;

  @BelongsTo(() => Publisher)
  publisher?: Publisher;

  @ForeignKey(() => Series)
  @Column(DataType.INTEGER)
  seriesId?: number;

  @BelongsTo(() => Series)
  series?: Series;
}

export default Book;
