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
import { AuthorAliasData } from "../../../types/src/author-aliases";

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

  clean(): AuthorAliasData {
    return this.get();
  }
}

export default AuthorAlias;
