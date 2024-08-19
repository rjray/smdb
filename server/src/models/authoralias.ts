/*
  AuthorAlias model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  AllowNull,
} from "sequelize-typescript";

import Author from "./author";

/**
 * JSON representation of an author alias record.
 *
 * @property {number} id - The ID of the author alias.
 * @property {string} name - The name of the author alias.
 * @property {number} authorId - The ID of the author associated with the alias.
 */
export type AuthorAliasRecord = {
  id: number;
  name: string;
  authorId: number;
};

@Table({ timestamps: false })
class AuthorAlias extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @ForeignKey(() => Author)
  @Column(DataType.INTEGER)
  authorId!: number;

  @BelongsTo(() => Author, { onDelete: "CASCADE" })
  author?: Author;

  clean(): AuthorAliasRecord {
    return this.get();
  }
}

export default AuthorAlias;
