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

/*
  Fetch all feature tags. Uses query parameters to opt-in on references and/or
  reference count.
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

/*
  Fetch a single feature tag by ID. Uses query parameters to opt-in on
  references and/or reference count.
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

/*
  Delete a single feature tag from the database (indicated by ID).
 */
export function deleteFeatureTag(id: number) {
  return FeatureTag.destroy({ where: { id } });
}
