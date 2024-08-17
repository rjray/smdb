/*
  Database operations focused on the Author model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Tag } from "models";
import { TagFetchOpts } from "types/tag";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: TagFetchOpts): string {
  return params.references ? "references" : "";
}

/*
  Fetch all tags. Uses query parameters to opt-in on references and/or
  reference count.
 */
export function fetchAllTags(opts: TagFetchOpts): Promise<Tag[]> {
  const scope = getScopeFromParams(opts);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`TagsReferences\`
                 WHERE \`tagId\` = Tag.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return Tag.scope(scope)
    .findAll(queryOpts)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Fetch a single tag by ID. Uses query parameters to opt-in on  references
  and/or reference count.
 */
export function fetchOneTag(
  id: number,
  opts: TagFetchOpts
): Promise<Tag | null> {
  const scope = getScopeFromParams(opts);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`TagsReferences\`
                 WHERE \`tagId\` = Tag.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return Tag.scope(scope)
    .findByPk(id, queryOpts)
    .then((tag) => tag)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single tag from the database (indicated by ID).
 */
export function deleteTag(id: number) {
  return Tag.destroy({ where: { id } });
}
