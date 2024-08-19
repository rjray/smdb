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

import Book, { BookRecord } from "./book";
import Publisher, { PublisherRecord } from "./publisher";

export type SeriesRecord = {
  id: number;
  name: string;
  notes?: string | null;
  publisherId?: number | null;
  publisher?: PublisherRecord;
  books?: Array<BookRecord>;
};

@Scopes(() => ({ publisher: { include: [Publisher] } }))
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

  @BelongsTo(() => Publisher, { onDelete: "CASCADE" })
  publisher?: Publisher;

  @HasMany(() => Book)
  books?: Book[];

  clean(): SeriesRecord {
    const result = this.get();

    if (result.publisher) result.publisher = result.publisher.clean();

    if (result.books) result.books = result.books.map((b: Book) => b.clean());

    return result;
  }
}

export default Series;
