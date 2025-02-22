/*
  Tag model definition.
 */

import {
  DataType,
  Scopes,
  Table,
  Column,
  Model,
  BelongsToMany,
  AllowNull,
} from "sequelize-typescript";

import Reference from "./reference";
import TagsReferences from "./tagsreferences";
import { TagData } from "@smdb-types/tags";

@Scopes(() => ({ references: { include: [Reference] } }))
@Table({ timestamps: false })
class Tag extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  type!: string | null;

  @Column(DataType.STRING)
  description!: string | null;

  @Column(DataType.VIRTUAL)
  referenceCount?: number;

  @BelongsToMany(() => Reference, () => TagsReferences)
  references?: Reference[];

  clean(): TagData {
    const result = this.get();
    delete result.TagsReferences;

    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }
}

export default Tag;
