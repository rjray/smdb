/*
  Reference model definition.
 */

import {
  AllowNull,
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  BelongsTo,
  BelongsToMany,
  HasOne,
  ForeignKey,
} from "sequelize-typescript";
import { ReferenceData } from "@smdb-types/references";
import { AuthorNewData } from "@smdb-types/authors";
import { TagNewData } from "@smdb-types/tags";

import Author from "./author";
import AuthorsReferences from "./authorsreferences";
import Book from "./book";
import MagazineFeature from "./magazinefeature";
import PhotoCollection from "./photocollection";
import ReferenceType from "./referencetype";
import Tag from "./tag";
import TagsReferences from "./tagsreferences";

@DefaultScope(() => ({
  include: [Book, MagazineFeature, PhotoCollection],
}))
@Scopes(() => ({
  authors: { include: [Author] },
  tags: { include: [Tag] },
}))
@Table
class Reference extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  language!: string | null;

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

  @HasOne(() => MagazineFeature)
  magazineFeature?: MagazineFeature;

  @HasOne(() => PhotoCollection)
  photoCollection?: PhotoCollection;

  clean(): ReferenceData {
    const result = { ...this.get() };
    delete result.AuthorsReferences;
    delete result.TagsReferences;

    switch (result.referenceTypeId) {
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
      default:
        // Case 3: Photo Collection
        delete result.book;
        delete result.magazineFeature;
        result.photoCollection = result.photoCollection.clean();
        break;
    }

    // The two dates are Date objects, convert them to ISO strings so that
    // they don't stringify automatically.
    for (const date of ["createdAt", "updatedAt"]) {
      if (result[date]) result[date] = result[date].toISOString();
    }

    if (result.referenceType)
      result.referenceType = result.referenceType.clean();
    if (result.authors)
      result.authors = result.authors.map((a: Author) => a.clean());
    if (result.tags) result.tags = result.tags.map((t: Tag) => t.clean());

    return result;
  }

  // One-to-many relations can be automatically populated by Sequelize when
  // the main object is created. But for many-to-many, we need to do it
  // manually.

  /**
   * Add authors to the reference. Takes an array of author structures as input.
   *
   * @param authors - The authors to add
   * @param opts - Options for bulkCreate
   * @returns Promise<number> - count of added authors
   */
  addAuthors(authors: AuthorNewData[], opts = {}): Promise<number> {
    const newAuthors = authors.map((a) => ({
      authorId: a.id,
      referenceId: this.id,
    }));

    return AuthorsReferences.bulkCreate(newAuthors, opts).then(
      (arefs) => arefs.length
    );
  }

  /**
   * Remove all AuthorsReferences records associated with the reference.
   *
   * @param opts - Options for destroy()
   * @returns Promise<number>
   */
  removeAuthors(opts = {}): Promise<number> {
    return AuthorsReferences.destroy({
      where: { referenceId: this.id },
      ...opts,
    });
  }

  /**
   * Add tags to the reference. Takes an array of tag structures as input.
   *
   * @param tags - The tags to add
   * @param opts - Options for bulkCreate
   * @returns Promise<number> - count of added tags
   */
  addTags(tags: TagNewData[], opts = {}): Promise<number> {
    const newTags = tags.map((tag) => ({
      tagId: tag.id,
      referenceId: this.id,
    }));

    return TagsReferences.bulkCreate(newTags, opts).then(
      (trefs) => trefs.length
    );
  }

  /**
   * Remove all TagsReferences records associated with the reference.
   *
   * @param opts - Options for destroy()
   * @returns Promise<number>
   */
  removeTags(opts = {}): Promise<number> {
    return TagsReferences.destroy({
      where: { referenceId: this.id },
      ...opts,
    });
  }
}

export default Reference;
