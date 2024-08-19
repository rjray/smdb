/*
  User model definition.
 */

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

/**
 * JSON representation of a user record.
 *
 * @property {number} id - The ID of the user.
 * @property {string} name - The name of the user.
 * @property {string} email - The email of the user.
 * @property {string} username - The username of the user.
 * @property {string} password - The password of the user.
 */
export type UserRecord = {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
};

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

  clean(): UserRecord {
    return this.get();
  }
}

export default User;
