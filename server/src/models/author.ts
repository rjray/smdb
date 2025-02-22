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

import AuthorAlias from "./authoralias";
import AuthorsReferences from "./authorsreferences";
import Reference from "./reference";
import { AuthorData } from "@smdb-types/authors";

@Scopes(() => ({
  references: { include: [Reference] },
  aliases: { include: [AuthorAlias] },
}))
@Table
class Author extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.VIRTUAL)
  referenceCount?: number;

  @HasMany(() => AuthorAlias)
  aliases?: AuthorAlias[];

  @BelongsToMany(() => Reference, () => AuthorsReferences)
  references?: Reference[];

  clean(): AuthorData {
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

    return result as AuthorData;
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
