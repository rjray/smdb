/*
  Database operations focused on the Magazine model.
 */

import { BaseError, FindOptions, QueryTypes } from "sequelize";
import { MagazineNewData, MagazineUpdateData } from "@smdb-types/magazines";

import { Sequelize, connection } from "../database";
import { Magazine } from "../models";
import { RequestOpts, getScopeFromParams } from "../utils";

/// The scopes that can be fetched for magazines.
const magazineScopes = ["issues"];

/**
 * Adds a magazine to the database.
 *
 * @param data - The magazine data to be added.
 * @returns A promise that resolves to the created magazine.
 */
export function createMagazine(data: MagazineNewData): Promise<Magazine> {
  return Magazine.create(data);
}

/**
 * Fetches all magazines with additional data based on the provided options.
 *
 * @param opts - The options for fetching magazines' additional data.
 * @returns A promise that resolves to an array of magazines.
 * @throws If there is an error while fetching the magazines.
 */
export function getAllMagazines(opts: RequestOpts = {}): Promise<Magazine[]> {
  const scope = getScopeFromParams(opts, magazineScopes);
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
export function getMagazineById(
  id: number,
  opts: RequestOpts = {}
): Promise<Magazine | null> {
  const scope = getScopeFromParams(opts, magazineScopes);
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
 * Fetches recently updated magazines. The results are ordered by the latest
 * update date and limited to the count provided in the options.
 *
 * @param opts - The request options.
 * @returns A promise that resolves to an array of magazines.
 */
export function getRecentlyUpdatedMagazines(
  opts: RequestOpts = {}
): Promise<Magazine[]> {
  const limit = opts.count || 10;

  const query = `
    SELECT
      m.\`id\`, m.\`name\`, m.\`language\`, m.\`aliases\`, m.\`notes\`,
      m.\`createdAt\`, m.\`updatedAt\`, x.\`latest\`
    FROM
      \`Magazines\` AS \`m\`
        LEFT OUTER JOIN
      (
        SELECT
          \`magazineId\`, MAX(\`updatedAt\`) AS \`latest\`
        FROM
          \`MagazineIssues\`
        GROUP BY \`magazineId\`
      ) AS \`x\` ON x.\`magazineId\` = m.\`id\`
    ORDER BY x.\`latest\` DESC

    LIMIT ${limit}
  `;

  const queryOptions = {
    type: QueryTypes.SELECT,
  };

  return connection.query(query, queryOptions).then((results) => {
    return results.map((result) =>
      Magazine.build(result as Record<string, unknown>)
    );
  });
}

/**
 * Updates a single magazine in the database based on the provided ID and data.
 *
 * @param id - The ID of the magazine to update.
 * @param data - The updated magazine data.
 * @returns A promise that resolves to the updated magazine.
 * @throws If the magazine is not found.
 */
export function updateMagazineById(
  id: number,
  data: MagazineUpdateData
): Promise<Magazine> {
  return Magazine.findByPk(id)
    .then((magazine) => {
      if (!magazine) {
        throw new Error("Magazine not found");
      }
      return magazine.update(data);
    })
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
export function deleteMagazineById(id: number) {
  return Magazine.destroy({ where: { id } });
}
