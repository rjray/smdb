/*
  Database operations focused on the User model.
 */

import { BaseError } from "sequelize";

import { User } from "../models";
import { UserNewData, UserUpdateData } from "@smdb-types/users";

/**
 * Create a new user in the database.
 *
 * @param data - The data for the new user.
 * @returns A promise that resolves to the created user.
 */
export function createUser(data: UserNewData): Promise<User> {
  return User.create(data);
}

/**
 * Fetches all users from the database.
 *
 * @returns A promise that resolves to an array of User objects.
 * @throws If there is an error while fetching the users.
 */
export function getAllUsers(): Promise<User[]> {
  return User.findAll().catch((error: BaseError) => {
    throw new Error(error.message);
  });
}

/**
 * Fetches a single user by ID from the database.
 *
 * @param id - The ID of the user to be fetched.
 * @returns A promise that resolves to the fetched user or null if not found.
 * @throws If there is an error while fetching the user.
 */
export function getUserById(id: number): Promise<User | null> {
  return User.findByPk(id)
    .then((user) => user)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single user by username from the database.
 *
 * @param username - The username of the user to be fetched.
 * @returns A promise that resolves to the fetched user or null if not found.
 * @throws If there is an error while fetching the user.
 */
export function getUserByUsername(username: string): Promise<User | null> {
  return User.findOne({ where: { username } })
    .then((user) => user)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Update a single user in the database based on the provided ID and data.
 *
 * @param id - The ID of the user to update.
 * @param data - The updated user data.
 * @returns A promise that resolves to the updated user or null if not found.
 */
export function updateUserById(
  id: number,
  data: UserUpdateData
): Promise<User | null> {
  return User.findByPk(id)
    .then((user) => {
      if (!user) {
        throw new Error("User not found");
      }
      return user.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a single user from the database by ID.
 *
 * @param id - The ID of the user to be deleted.
 * @returns A promise that resolves to the number of deleted users.
 * @throws If there is an error while deleting the user.
 */
export function deleteUserById(id: number) {
  return User.destroy({ where: { id } });
}
