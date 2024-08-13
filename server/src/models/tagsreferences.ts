/*
  TagsReferences relational model definition.
 */

import { Table, Column, Model, ForeignKey } from "sequelize-typescript";

import Tag from "./tag";
import Reference from "./reference";

@Table({ timestamps: false })
class TagsReferences extends Model {
  @ForeignKey(() => Tag)
  @Column
  tagId!: number;

  @ForeignKey(() => Reference)
  @Column
  referenceId!: number;
}

export default TagsReferences;
