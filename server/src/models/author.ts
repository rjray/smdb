/*
  Author model definition.
 */

import {
  DefaultScope,
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

@DefaultScope(() => ({
  attributes: ["id", "name", "createdAt", "updatedAt"],
}))
@Scopes(() => ({
  full: { include: [AuthorAlias, Reference] },
  withAliases: { include: [AuthorAlias] },
}))
@Table
class Author extends Model {
  @Column({ allowNull: false })
  name!: string;

  @HasMany(() => AuthorAlias)
  aliases?: AuthorAlias[];

  @BelongsToMany(() => Reference, () => AuthorsReferences)
  references?: Reference[];
}

export default Author;
