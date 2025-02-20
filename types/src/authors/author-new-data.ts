/**
 * Type declaration for author data when creating a new author.
 */

import { AuthorAliasForNewAuthor } from "../author-aliases";

export type AuthorNewData = {
  id?: number;
  name: string;
  aliases?: Array<AuthorAliasForNewAuthor>;
};
