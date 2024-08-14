/*
  Publisher model definition.
 */

import {
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  HasMany,
  AllowNull,
  Unique,
} from "sequelize-typescript";

import Book from "./book";
import Series from "./series";

@DefaultScope(() => ({ attributes: ["id", "name", "notes"] }))
@Scopes(() => ({ series: { include: [Series] } }))
@Table({ timestamps: false })
class Publisher extends Model {
  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  notes?: string | null;

  @HasMany(() => Book)
  books?: Book[];

  @HasMany(() => Series)
  series?: Series[];
}

export default Publisher;
