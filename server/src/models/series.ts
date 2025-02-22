/*
  Series model definition.
 */

import {
  DataType,
  Scopes,
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
import { SeriesData } from "@smdb-types/series";

@Scopes(() => ({
  books: { include: [Book] },
  publisher: { include: [Publisher] },
}))
@Table({ timestamps: false })
class Series extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  notes!: string | null;

  @ForeignKey(() => Publisher)
  @Column(DataType.INTEGER)
  publisherId!: number | null;

  @BelongsTo(() => Publisher, { onDelete: "CASCADE" })
  publisher?: Publisher;

  @HasMany(() => Book)
  books?: Book[];

  clean(): SeriesData {
    const result = this.get();

    if (result.publisher) result.publisher = result.publisher.clean();
    if (result.books) result.books = result.books.map((b: Book) => b.clean());

    return result;
  }
}

export default Series;
