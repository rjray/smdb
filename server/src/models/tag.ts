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

/**
 * JSON representation of a tag record.
 *
 * @property {number} id - The ID of the tag.
 * @property {string} name - The name of the tag.
 * @property {string|null} type - The type of the tag (optional).
 * @property {string|null} description - The description of the tag (optional).
 * @property {number|null} [referenceCount] - The count of references to the tag
 * (optional).
 * @property {ReferenceRecord[]} [references] - An array of reference records
 * (optional).
 */
export type TagRecord = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
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

  @Column(DataType.VIRTUAL)
  referenceCount?: number;

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
