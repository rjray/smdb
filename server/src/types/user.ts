/**
 * Types needed for the User model beyond the model declaration itself.
 */

export type UserNewData = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type UserUpdateData = {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
};
