/*
  AuthorsReferences relational model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  ForeignKey,
} from "sequelize-typescript";

import Author from "./author";
import Reference from "./reference";

@Table({ timestamps: false })
class AuthorsReferences extends Model {
  @ForeignKey(() => Author)
  @Column(DataType.INTEGER)
  authorId!: number;

  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;
}

export default AuthorsReferences;
