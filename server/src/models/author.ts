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
}

export default Author;
