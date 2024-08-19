/*
  Database operations focused on the Magazine model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Magazine } from "models";
import { MagazineFetchOpts } from "types/magazine";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: MagazineFetchOpts): string {
  return params.issues ? "issues" : "";
}

/*
  Fetch all magazines. Uses query parameters to opt-in on issues or issue count.
 */
export function fetchAllMagazines(
  opts: MagazineFetchOpts
): Promise<Magazine[]> {
  const scope = getScopeFromParams(opts);
  const queryOpts: FindOptions = opts.issueCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`MagazineIssues\`
                 WHERE \`magazineId\` = Magazine.\`id\`)`
              ),
              "issueCount",
            ],
          ],
        },
      }
    : {};

  return Magazine.scope(scope)
    .findAll(queryOpts)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Fetch a single magazine by ID. Uses query parameters to opt-in on issues or
  issue count.
 */
export function fetchOneMagazine(
  id: number,
  opts: MagazineFetchOpts
): Promise<Magazine | null> {
  const scope = getScopeFromParams(opts);
  const queryOpts: FindOptions = opts.issueCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`MagazineIssues\`
                 WHERE \`magazineId\` = Magazine.\`id\`)`
              ),
              "issueCount",
            ],
          ],
        },
      }
    : {};

  return Magazine.scope(scope)
    .findByPk(id, queryOpts)
    .then((magazine) => magazine)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single magazine from the database (indicated by ID).
 */
export function deleteMagazine(id: number) {
  return Magazine.destroy({ where: { id } });
}
