/*
  Publisher model definition.
 */

import {
  DataType,
  DefaultScope,
  Table,
  Column,
  Model,
  HasMany,
} from "sequelize-typescript";

import Book from "./book";
import Series from "./series";

@DefaultScope(() => ({
  attributes: ["id", "name", "notes"],
}))
@Table({ timestamps: false })
class Publisher extends Model {
  @Column({
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => Book)
  books?: Book[];

  @HasMany(() => Series)
  series?: Series[];
}

export default Publisher;
