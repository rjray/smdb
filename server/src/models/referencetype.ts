/*
  ReferenceType model definition.
 */

import { DataType, Table, Column, Model, HasMany } from "sequelize-typescript";

import Reference from "./reference";

@Table({ timestamps: false })
class ReferenceType extends Model {
  @Column({ allowNull: false, unique: true })
  name!: string;

  @Column({ allowNull: false })
  description!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => Reference)
  references?: Reference[];
}

export default ReferenceType;
