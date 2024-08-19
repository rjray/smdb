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

/**
 * JSON representation of a reference type record.
 *
 * @property {number} id - The ID of the reference type.
 * @property {string} name - The name of the reference type.
 * @property {string} description - The description of the reference type.
 * @property {string|null} [notes] - Additional notes about the reference type
 * (optional).
 * @property {ReferenceRecord[]} [references] - An array of reference records
 * associated with the reference type (optional).
 */
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
