/*
  PhotoCollection model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
} from "sequelize-typescript";
import { PhotoCollectionData } from "@smdb-types/photo-collections";

import Reference from "./reference";

@Table({ timestamps: false })
class PhotoCollection extends Model {
  @PrimaryKey
  @ForeignKey(() => Reference)
  @Column(DataType.INTEGER)
  referenceId!: number;

  @BelongsTo(() => Reference, { onDelete: "CASCADE" })
  reference?: Reference;

  @Column(DataType.STRING)
  location!: string;

  @Column(DataType.STRING)
  media!: string;

  clean(): PhotoCollectionData {
    const result = this.get();

    if (result.reference) result.reference = result.reference.clean();

    return result;
  }
}

export default PhotoCollection;
