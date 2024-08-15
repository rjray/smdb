/*
  ReferenceType model definition.
 */

import {
  DataType,
  Table,
  Column,
  Model,
  HasMany,
  AllowNull,
  Unique,
} from "sequelize-typescript";

import Reference from "./reference";

@Table({ timestamps: false })
class ReferenceType extends Model {
  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  description!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => Reference)
  references?: Reference[];

  clean() {
    const result = this.get();

    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }
}

export default ReferenceType;
