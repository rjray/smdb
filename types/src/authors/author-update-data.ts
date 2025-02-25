/**
 * Type declaration for author data when updating an author.
 */

import { AuthorAliasForAuthorUpdate } from "../author-aliases";

export type AuthorUpdateData = {
  id?: number;
  name?: string;
  aliases?: Array<AuthorAliasForAuthorUpdate>;
};
