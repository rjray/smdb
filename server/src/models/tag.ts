/*
  Tag model definition.
 */

import {
  DataType,
  DefaultScope,
  Scopes,
  Table,
  Column,
  Model,
  BelongsToMany,
} from "sequelize-typescript";

import Reference from "./reference";
import TagsReferences from "./tagsreferences";

@DefaultScope(() => ({
  attributes: ["id", "name", "type", "description"],
}))
@Scopes(() => ({
  references: { include: [Reference] },
}))
@Table({ timestamps: false })
class Tag extends Model {
  @Column({ allowNull: false })
  name!: string;

  @Column(DataType.STRING)
  type?: string | null;

  @Column(DataType.STRING)
  description?: string | null;

  @BelongsToMany(() => Reference, () => TagsReferences)
  references?: Reference[];
}

export default Tag;
