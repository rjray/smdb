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

@DefaultScope(() => ({ include: [Publisher, Series] }))
@Table({ timestamps: false })
class Book extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference, { onDelete: "CASCADE" })
  reference?: Reference;

  @Column(DataType.STRING)
  isbn?: string | null;

  @Column(DataType.STRING)
  seriesNumber?: string | null;

  @ForeignKey(() => Publisher)
  @Column(DataType.INTEGER)
  publisherId?: number;

  @BelongsTo(() => Publisher, { onDelete: "SET NULL" })
  publisher?: Publisher;

  @ForeignKey(() => Series)
  @Column(DataType.INTEGER)
  seriesId?: number;

  @BelongsTo(() => Series, { onDelete: "SET NULL" })
  series?: Series;

  clean() {
    const result = this.get();

    if (result.publisher) result.publisher = result.publisher.clean();
    if (result.series) result.series = result.series.clean();

    return result;
  }
}

export default Book;
