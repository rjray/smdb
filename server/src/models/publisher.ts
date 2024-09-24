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

import Book, { BookRecord } from "./book";
import Series, { SeriesRecord } from "./series";

/**
 * JSON representation of a publisher record.
 *
 * @property {number} id - The ID of the publisher.
 * @property {string} name - The name of the publisher.
 * @property {string|null} notes - Additional notes about the publisher
 * (optional).
 * @property {BookRecord[]} [books] - An array of book records associated with
 * the publisher (optional).
 * @property {SeriesRecord[]} [series] - An array of series records associated
 * with the publisher (optional).
 */
export type PublisherRecord = {
  id: number;
  name: string;
  notes: string | null;
  books?: Array<BookRecord>;
  series?: Array<SeriesRecord>;
};

@Scopes(() => ({
  books: { include: [Book] },
  series: { include: [Series] },
}))
@Table({ timestamps: false })
class Publisher extends Model {
  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  notes!: string | null;

  @HasMany(() => Book)
  books?: Book[];

  @HasMany(() => Series)
  series?: Series[];

  clean(): PublisherRecord {
    const result = this.get();

    if (result.books) result.books = result.books.map((b: Book) => b.clean());
    if (result.series)
      result.series = result.series.map((s: Series) => s.clean());

    return result;
  }
}

export default Publisher;
