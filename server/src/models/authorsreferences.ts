/*
  AuthorsReferences relational model definition.
 */

import { Table, Column, Model, ForeignKey } from "sequelize-typescript";

import Author from "./author";
import Reference from "./reference";

@Table({ timestamps: false })
class AuthorsReferences extends Model {
  @ForeignKey(() => Author)
  @Column
  authorId!: number;

  @ForeignKey(() => Reference)
  @Column
  referenceId!: number;
}

export default AuthorsReferences;
