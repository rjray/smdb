/**
 * AuthorAlias basic data type.
 */

/**
 * JSON representation of an author alias record.
 *
 * @property {number} id - The ID of the author alias.
 * @property {string} name - The name of the author alias.
 * @property {number} authorId - The ID of the author associated with the alias.
 */
export type AuthorAliasData = {
  id: number;
  name: string;
  authorId: number;
};
