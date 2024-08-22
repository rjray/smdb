/*
  Database operations focused on the Tag model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Tag } from "models";
import { TagFetchOpts } from "types/tag";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: TagFetchOpts): string {
  return params.references ? "references" : "";
}

type TagData = {
  name: string;
  type?: string | null;
  description?: string | null;
};

/**
 * Adds a tag to the database.
 *
 * @param data - The tag data to be added.
 * @returns A promise that resolves to the created tag.
 */
export function addTag(data: TagData): Promise<Tag> {
  return Tag.create(data);
}

/**
 * Fetches all tags with additional data based on the provided options.
 *
 * @param opts - The options for fetching tags' additional data.
 * @returns A promise that resolves to an array of tags.
 * @throws If there is an error while fetching the tags.
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

/**
 * Fetches a single tag by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the tag to fetch.
 * @param opts - The options for fetching the tag's additional data.
 * @returns A promise that resolves to the fetched tag or null if not found.
 * @throws If there is an error while fetching the tag.
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

/**
 * Deletes a single tag from the database based on the provided ID.
 *
 * @param id - The ID of the tag to delete.
 * @returns A promise that resolves to the number of deleted tags.
 */
export function deleteTag(id: number) {
  return Tag.destroy({ where: { id } });
}
