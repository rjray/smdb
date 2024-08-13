/*
  TagsReferences relational model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  ForeignKey,
} from "sequelize-typescript";

import Tag from "./tag";
import Reference from "./reference";

@Table({ timestamps: false })
class TagsReferences extends Model {
  @ForeignKey(() => Tag)
  @Column(DataType.INTEGER)
  tagId!: number;

  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;
}

export default TagsReferences;
