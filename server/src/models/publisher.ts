/*
  Publisher model definition.
 */

import {
  DataType,
  Scopes,
  Table,
  Column,
  Model,
  HasMany,
  AllowNull,
  Unique,
} from "sequelize-typescript";

import Book from "./book";
import Series from "./series";

@Scopes(() => ({ series: { include: [Series] } }))
@Table({ timestamps: false })
class Publisher extends Model {
  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => Book)
  books?: Book[];

  @HasMany(() => Series)
  series?: Series[];

  clean() {
    const result = this.get();

    if (result.books) result.books = result.books.map((b: Book) => b.clean());
    if (result.series)
      result.series = result.series.map((s: Series) => s.clean());

    return result;
  }
}

export default Publisher;
