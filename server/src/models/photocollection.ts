/*
  PhotoCollection model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
} from "sequelize-typescript";

import Reference from "./reference";

@DefaultScope(() => ({ attributes: ["location", "media"] }))
@Table({ timestamps: false })
class PhotoCollection extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference)
  reference?: Reference;

  @Column(DataType.STRING)
  location!: string;

  @Column(DataType.STRING)
  media!: string;
}

export default PhotoCollection;
