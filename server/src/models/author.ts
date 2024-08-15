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

@Scopes(() => ({
  full: { include: [AuthorAlias, Reference] },
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

  clean() {
    const result = this.get();

    // The two dates are Date objects, convert them to ISO strings so that
    // they don't stringify automatically.
    for (const date of ["createdAt", "updatedAt"]) {
      if (result[date]) result[date] = result[date].toISOString();
    }

    if (result.aliases)
      result.aliases = result.aliases.map((a: AuthorAlias) => a.clean());

    return result;
  }
}

export default Author;
