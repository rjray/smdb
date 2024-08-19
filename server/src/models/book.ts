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

import Publisher, { PublisherRecord } from "./publisher";
import Reference, { ReferenceRecord } from "./reference";
import Series, { SeriesRecord } from "./series";

/**
 * JSON representation of a book record.
 *
 * @property {number} referenceId - The ID of the reference.
 * @property {string|null} [isbn] - The ISBN of the book (optional).
 * @property {string|null} [seriesNumber] - The series number of the book
 * (optional).
 * @property {number|null} [publisherId] - The ID of the publisher (optional).
 * @property {number|null} [seriesId] - The ID of the series (optional).
 * @property {ReferenceRecord} [reference] - The reference record (optional).
 * @property {PublisherRecord} [publisher] - The publisher record (optional).
 * @property {SeriesRecord} [series] - The series record (optional).
 */
export type BookRecord = {
  referenceId: number;
  isbn?: string | null;
  seriesNumber?: string | null;
  publisherId?: number | null;
  seriesId?: number | null;
  reference?: ReferenceRecord;
  publisher?: PublisherRecord;
  series?: SeriesRecord;
};

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

  clean(): BookRecord {
    const result = this.get();

    if (result.publisher) result.publisher = result.publisher.clean();
    if (result.series) result.series = result.series.clean();
    if (result.reference) result.reference = result.reference.clean();

    return result;
  }
}

export default Book;
