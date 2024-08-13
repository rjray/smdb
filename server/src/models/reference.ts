/*
  Reference model definition.
 */

import {
  AllowNull,
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  BelongsTo,
  BelongsToMany,
  HasOne,
  ForeignKey,
} from "sequelize-typescript";

import Author from "./author";
import AuthorsReferences from "./authorsreferences";
import Book from "./book";
import PhotoCollection from "./photocollection";
import ReferenceType from "./referencetype";
import Tag from "./tag";
import TagsReferences from "./tagsreferences";

@DefaultScope(() => ({
  attributes: ["id", "name", "language", "createdAt", "updatedAt"],
  include: [ReferenceType, Author, Tag, Book, PhotoCollection],
}))
@Table
class Reference extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  language?: string | null;

  @ForeignKey(() => ReferenceType)
  @Column(DataType.INTEGER)
  referenceTypeId!: number;

  @BelongsTo(() => ReferenceType)
  referenceType?: ReferenceType;

  @BelongsToMany(() => Author, () => AuthorsReferences)
  authors?: Author[];

  @BelongsToMany(() => Tag, () => TagsReferences)
  tags?: Tag[];

  @HasOne(() => Book)
  book?: Book;

  @HasOne(() => PhotoCollection)
  photoCollection?: PhotoCollection;
}

export default Reference;
