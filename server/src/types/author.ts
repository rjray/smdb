/*
  Types related to the Author model and code.
 */

export type AuthorFetchOpts = {
  aliases?: boolean;
  references?: boolean;
  referenceCount?: boolean;
};

export type AuthorAliasRecord = {
  id: number;
  name: string;
};

export type AuthorRecord = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  referenceCount?: number;
  aliases?: Array<AuthorAliasRecord>;
  // TODO: Replace this when references are typed
  references?: Array<unknown>;
};
