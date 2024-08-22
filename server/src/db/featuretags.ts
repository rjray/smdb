/*
  Database operations focused on the FeatureTag model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { FeatureTag } from "models";
import { FeatureTagFetchOpts } from "types/featuretag";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: FeatureTagFetchOpts): string {
  return params.references ? "references" : "";
}

type FeatureTagData = {
  name: string;
  description?: string | null;
};

/**
 * Adds a feature tag to the database.
 *
 * @param data - The feature tag data to be added.
 * @returns A promise that resolves to the created feature tag.
 */
export function addFeatureTag(data: FeatureTagData): Promise<FeatureTag> {
  return FeatureTag.create(data);
}

/**
 * Fetches all feature tags with additional data based on the provided options.
 *
 * @param opts - The options for fetching feature tags' additional data.
 * @returns A promise that resolves to an array of feature tags.
 * @throws If there is an error while fetching the feature tags.
 */
export function fetchAllFeatureTags(
  opts: FeatureTagFetchOpts
): Promise<FeatureTag[]> {
  const scope = getScopeFromParams(opts);
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
export function fetchOneFeatureTag(
  id: number,
  opts: FeatureTagFetchOpts
): Promise<FeatureTag | null> {
  const scope = getScopeFromParams(opts);
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
 * Deletes a feature tag from the database based on the provided ID.
 *
 * @param id - The ID of the feature tag to delete.
 * @returns A promise that resolves to the number of deleted feature tags.
 */
export function deleteFeatureTag(id: number) {
  return FeatureTag.destroy({ where: { id } });
}
