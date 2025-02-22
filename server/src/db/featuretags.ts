/*
  Database operations focused on the FeatureTag model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { FeatureTag } from "models";
import {
  FeatureTagNewData,
  FeatureTagUpdateData,
} from "@smdb-types/feature-tags";
import { RequestOpts, getScopeFromParams } from "utils";

/// The scopes that can be fetched for feature tags.
const featureTagScopes = ["features"];

/**
 * Adds a feature tag to the database.
 *
 * @param data - The feature tag data to be added.
 * @returns A promise that resolves to the created feature tag.
 */
export function createFeatureTag(data: FeatureTagNewData): Promise<FeatureTag> {
  return FeatureTag.create(data);
}

/**
 * Fetches all feature tags with additional data based on the provided options.
 *
 * @param opts - The options for fetching feature tags' additional data.
 * @returns A promise that resolves to an array of feature tags.
 * @throws If there is an error while fetching the feature tags.
 */
export function getAllFeatureTags(
  opts: RequestOpts = {}
): Promise<FeatureTag[]> {
  const scope = getScopeFromParams(opts, featureTagScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`FeatureTagsMagazineFeatures\`
                 WHERE \`featureTagId\` = FeatureTag.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return FeatureTag.scope(scope)
    .findAll(queryOpts)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single feature tag by ID with additional data based on the
 * provided options.
 *
 * @param id - The ID of the feature tag to fetch.
 * @param opts - The options for fetching the feature tag's additional data.
 * @returns A promise that resolves to the fetched feature tag or null if not
 * found.
 * @throws If there is an error while fetching the feature tag.
 */
export function getFeatureTagById(
  id: number,
  opts: RequestOpts = {}
): Promise<FeatureTag | null> {
  const scope = getScopeFromParams(opts, featureTagScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`FeatureTagsMagazineFeatures\`
                 WHERE \`featureTagId\` = FeatureTag.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return FeatureTag.scope(scope)
    .findByPk(id, queryOpts)
    .then((featureTag) => featureTag)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates a feature tag in the database based on the provided ID and data.
 *
 * @param id - The ID of the feature tag to update.
 * @param data - The feature tag data to update.
 * @returns A promise that resolves to the updated feature tag.
 * @throws If the feature tag is not found.
 */
export function updateFeatureTagById(
  id: number,
  data: FeatureTagUpdateData
): Promise<FeatureTag> {
  return FeatureTag.findByPk(id)
    .then((featureTag) => {
      if (!featureTag) {
        throw new Error("Feature tag not found");
      }
      return featureTag.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a feature tag from the database based on the provided ID.
 *
 * @param id - The ID of the feature tag to delete.
 * @returns A promise that resolves to the number of deleted feature tags.
 */
export function deleteFeatureTagById(id: number) {
  return FeatureTag.destroy({ where: { id } });
}
