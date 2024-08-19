/*
  Database operations focused on the User model.
 */

import { BaseError } from "sequelize";

import { User } from "models";

/*
  Fetch all users.
 */
export function fetchAllUsers(): Promise<User[]> {
  return User.findAll().catch((error: BaseError) => {
    throw new Error(error.message);
  });
}

/*
  Fetch a single user by ID.
 */
export function fetchOneUser(id: number): Promise<User | null> {
  return User.findByPk(id)
    .then((user) => user)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Fetch a single user by username.
 */
export function fetchUserByUsername(username: string): Promise<User | null> {
  return User.findOne({ where: { username } })
    .then((user) => user)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single user from the database (indicated by ID).
 */
export function deleteUser(id: number) {
  return User.destroy({ where: { id } });
}
