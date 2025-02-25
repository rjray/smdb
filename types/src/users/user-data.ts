/**
 * Type declaration for basic user data.
 */

/**
 * JSON representation of a user record.
 *
 * @property {number} id - The ID of the user.
 * @property {string} name - The name of the user.
 * @property {string} email - The email of the user.
 * @property {string} username - The username of the user.
 * @property {string} password - The password of the user.
 * @property {string} createdAt - The creation date of the user record.
 * @property {string} updatedAt - The last update date of the user record.
 */
export type UserData = {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};
