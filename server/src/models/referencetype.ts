/*
  ReferenceType model definition.
 */

import {
  Scopes,
  DataType,
  Table,
  Column,
  Model,
  HasMany,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { ReferenceTypeData } from "@smdb-types/reference-types";

import Reference from "./reference";

@Scopes(() => ({ references: { include: [Reference] } }))
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
  notes!: string | null;

  @Column(DataType.VIRTUAL)
  referenceCount?: number;

  @HasMany(() => Reference)
  references?: Reference[];

  clean(): ReferenceTypeData {
    const result = this.get();

    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }
}

export default ReferenceType;
