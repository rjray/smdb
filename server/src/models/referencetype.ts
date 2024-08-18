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

import Reference, { ReferenceRecord } from "./reference";

export type ReferenceTypeRecord = {
  id: number;
  name: string;
  description: string;
  notes?: string | null;
  references?: Array<ReferenceRecord>;
};

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

  clean(): ReferenceTypeRecord {
    const result = this.get();

    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }
}

export default ReferenceType;
