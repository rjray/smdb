/**
 * Types needed for the Author model beyond the model declaration itself.
 */

export type AuthorNewData = {
  id?: number;
  name: string;
  aliases?: {
    name: string;
  }[];
};

export type AuthorUpdateData = {
  name?: string;
  aliases?: {
    name: string;
    deleted?: boolean;
  }[];
};

export type AuthorForReference = {
  id?: number;
  name?: string;
};
