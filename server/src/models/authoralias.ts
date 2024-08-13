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
  HasOne,
  ForeignKey,
} from "sequelize-typescript";

import Author from "./author";

@DefaultScope(() => ({ attributes: ["id", "name"] }))
@Table({ timestamps: false })
class AuthorAlias extends Model {
  @Column({ allowNull: false })
  name!: string;

  @ForeignKey(() => Author)
  authorId!: number;

  @BelongsTo(() => Author, { onDelete: "CASCADE" })
  author?: Author;
}

export default AuthorAlias;
