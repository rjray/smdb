/*
  Database operations focused on the Tag model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "../database";
import { Tag } from "../models";
import { TagNewData, TagUpdateData } from "@smdb-types/tags";
import { RequestOpts, getScopeFromParams } from "../utils";

/// The scopes that can be fetched for tags.
const tagScopes = ["references"];

/**
 * Adds a tag to the database.
 *
 * @param data - The tag data to be added.
 * @returns A promise that resolves to the created tag.
 */
export function createTag(data: TagNewData): Promise<Tag> {
  return Tag.create(data);
}

/**
 * Fetches all tags with additional data based on the provided options.
 *
 * @param opts - The options for fetching tags' additional data.
 * @returns A promise that resolves to an array of tags.
 * @throws If there is an error while fetching the tags.
 */
export function getAllTags(opts: RequestOpts = {}): Promise<Tag[]> {
  const scope = getScopeFromParams(opts, tagScopes);
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
export function getTagById(
  id: number,
  opts: RequestOpts = {}
): Promise<Tag | null> {
  const scope = getScopeFromParams(opts, tagScopes);
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
 * Updates a single tag in the database based on the provided ID and data.
 *
 * @param id - The ID of the tag to update.
 * @param data - The updated tag data.
 * @returns A promise that resolves to the updated tag.
 * @throws If the tag is not found.
 */
export function updateTagById(id: number, data: TagUpdateData): Promise<Tag> {
  return Tag.findByPk(id)
    .then((tag) => {
      if (!tag) {
        throw new Error("Tag not found");
      }

      return tag.update(data);
    })
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
export function deleteTagById(id: number) {
  return Tag.destroy({ where: { id } });
}
