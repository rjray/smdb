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
import MagazineFeature from "./magazinefeature";
import PhotoCollection from "./photocollection";
import ReferenceType from "./referencetype";
import Tag from "./tag";
import TagsReferences from "./tagsreferences";

@DefaultScope(() => ({
  attributes: ["id", "name", "language", "createdAt", "updatedAt"],
  include: [ReferenceType, Author, Tag, Book, MagazineFeature, PhotoCollection],
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
  referenceType!: ReferenceType;

  @BelongsToMany(() => Author, () => AuthorsReferences)
  authors?: Author[];

  @BelongsToMany(() => Tag, () => TagsReferences)
  tags?: Tag[];

  @HasOne(() => Book)
  book?: Book;

  @HasOne(() => MagazineFeature)
  magazineFeature?: MagazineFeature;

  @HasOne(() => PhotoCollection)
  photoCollection?: PhotoCollection;

  clean() {
    const result = this.get();
    delete result.AuthorsReferences;
    delete result.TagsReferences;

    switch (result.referenceType.id) {
      case 1:
        // Book
        delete result.magazineFeature;
        delete result.photoCollection;
        result.book = result.book.clean();
        break;
      case 2:
        // Magazine Feature
        delete result.book;
        delete result.photoCollection;
        result.magazineFeature = result.magazineFeature.clean();
        break;
      case 3:
        // Photo Collection
        delete result.book;
        delete result.magazineFeature;
        result.photoCollection = result.photoCollection.clean();
        break;
      default:
        break;
    }

    if (result.authors)
      result.authors = result.authors.map((a: Author) => a.clean());
    if (result.tags) result.tags = result.tags.map((t: Tag) => t.clean());

    return result;
  }
}

export default Reference;
