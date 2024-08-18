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

import Reference, { ReferenceRecord } from "./reference";

export type PhotoCollectionRecord = {
  referenceId: number;
  location: string;
  media: string;
  reference?: ReferenceRecord;
};

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

  clean(): PhotoCollectionRecord {
    const result = this.get();

    if (result.reference) result.reference = result.reference.clean();

    return result;
  }
}

export default PhotoCollection;
