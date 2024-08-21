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

type MagazineData = {
  name: string;
  language?: string;
  aliases?: string;
  notes?: string;
};

/**
 * Adds a magazine to the database.
 *
 * @param data - The magazine data to be added.
 * @returns A promise that resolves to the created magazine.
 */
export function addMagazine(data: MagazineData): Promise<Magazine> {
  return Magazine.create(data);
}

/**
 * Fetches all magazines with additional data based on the provided options.
 *
 * @param opts - The options for fetching magazines' additional data.
 * @returns A promise that resolves to an array of magazines.
 * @throws If there is an error while fetching the magazines.
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

/**
 * Fetches a single magazine by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the magazine to fetch.
 * @param opts - The options for fetching the magazine's additional data.
 * @returns A promise that resolves to the fetched magazine or null if not
 * found.
 * @throws If there is an error while fetching the magazine.
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

/**
 * Deletes a single magazine from the database based on the provided ID.
 *
 * @param id - The ID of the magazine to delete.
 * @returns A promise that resolves to the number of deleted magazines.
 */
export function deleteMagazine(id: number) {
  return Magazine.destroy({ where: { id } });
}
