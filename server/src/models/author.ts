/*
  Author model definition.
 */

import {
  AllowNull,
  DataType,
  Scopes,
  Table,
  Column,
  Model,
  HasMany,
  BelongsToMany,
} from "sequelize-typescript";

import AuthorAlias, { AuthorAliasRecord } from "./authoralias";
import AuthorsReferences from "./authorsreferences";
import Reference, { ReferenceRecord } from "./reference";

/**
 * JSON representation of an author record.
 *
 * @property {number} id - The unique identifier of the author.
 * @property {string} name - The name of the author.
 * @property {string} createdAt - The date and time when the author record was
 *            created.
 * @property {string} updatedAt - The date and time when the author record was
 *            last updated.
 * @property {number} [referenceCount] - The number of references associated
 *            with the author.
 * @property {Array<AuthorAliasRecord>} [aliases] - An array of author alias
 *            records associated with the author.
 * @property {Array<ReferenceRecord>} [references] - An array of reference
 *            records associated with the author.
 */
export type AuthorRecord = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  referenceCount?: number;
  aliases?: Array<AuthorAliasRecord>;
  references?: Array<ReferenceRecord>;
};

@Scopes(() => ({
  references: { include: [Reference] },
  aliases: { include: [AuthorAlias] },
}))
@Table
class Author extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @HasMany(() => AuthorAlias)
  aliases?: AuthorAlias[];

  @BelongsToMany(() => Reference, () => AuthorsReferences)
  references?: Reference[];

  clean(): AuthorRecord {
    const result = { ...this.get() };
    delete result.AuthorsReferences;

    // The two dates are Date objects, convert them to ISO strings so that
    // they don't stringify automatically.
    for (const date of ["createdAt", "updatedAt"]) {
      if (result[date]) result[date] = result[date].toISOString();
    }

    if (result.aliases)
      result.aliases = result.aliases.map((a: AuthorAlias) => a.clean());
    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }

  /**
   * Remove all AuthorAlias records associated with the author.
   *
   * @returns Promise<number>
   */
  removeAliases(): Promise<number> {
    return AuthorAlias.destroy({ where: { authorId: this.id } });
  }

  /**
   * Add aliases to the author. Takes an array of strings as input.
   *
   * @param aliases - The aliases to add
   * @returns Promise<AuthorAlias[]>
   */
  addAliases(aliases: string[]): Promise<AuthorAlias[]> {
    return AuthorAlias.bulkCreate(
      aliases.map((a) => ({ name: a, authorId: this.id }))
    );
  }
}

export default Author;
