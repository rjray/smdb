/**
 * Types needed for the Author model beyond the model declaration itself.
 */

export type AuthorUpdateData = {
  name?: string;
  aliases?: {
    name: string;
    deleted?: boolean;
  }[];
};

export type AuthorNewData = {
  name: string;
  aliases?: {
    name: string;
  }[];
};
