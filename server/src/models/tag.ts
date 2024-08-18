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

import Reference, { ReferenceRecord } from "./reference";
import TagsReferences from "./tagsreferences";

export type TagRecord = {
  id: number;
  name: string;
  type?: string;
  description?: string;
  referenceCount?: number;
  references?: Array<ReferenceRecord>;
};

@Scopes(() => ({ references: { include: [Reference] } }))
@Table({ timestamps: false })
class Tag extends Model {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  type?: string | null;

  @Column(DataType.STRING)
  description?: string | null;

  @BelongsToMany(() => Reference, () => TagsReferences)
  references?: Reference[];

  clean(): TagRecord {
    const result = this.get();
    delete result.TagsReferences;

    if (result.references)
      result.references = result.references.map((r: Reference) => r.clean());

    return result;
  }
}

export default Tag;
