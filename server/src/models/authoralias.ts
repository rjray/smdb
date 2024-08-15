/*
  AuthorAlias model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  AllowNull,
} from "sequelize-typescript";

import Author from "./author";

@DefaultScope(() => ({ attributes: ["id", "name"] }))
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

  clean() {
    return this.get();
  }
}

export default AuthorAlias;
