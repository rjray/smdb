/*
  User model definition.
 */

import { UserData } from "@smdb-types/users";

import {
  PrimaryKey,
  Table,
  Column,
  Model,
  AutoIncrement,
  AllowNull,
  Unique,
  DataType,
} from "sequelize-typescript";

@Table
class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  username!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  clean(): UserData {
    return { ...this.get() };
  }
}

export default User;
