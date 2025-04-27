/*
  Database operations focused on the MagazineIssue model.
 */

import { BaseError, FindOptions } from "sequelize";
import {
  MagazineIssueNewData,
  MagazineIssueUpdateData,
} from "@smdb-types/magazine-issues";

import { Sequelize } from "../database";
import { MagazineIssue } from "../models";
import { RequestOpts, getScopeFromParams } from "../utils";

/// The scopes that can be fetched for magazine issues.
const magazineIssueScopes = ["magazine", "features"];

/**
 * Adds a magazine issue to the database.
 *
 * @param data - The magazine issue data to be added.
 * @returns A promise that resolves to the created magazine issue.
 */
export function createMagazineIssue(
  data: MagazineIssueNewData
): Promise<MagazineIssue> {
  return MagazineIssue.create(data);
}

/**
 * Fetch all magazine issues with additional data based on the provided options.
 * Can fetch for just one magazine or all of them, based on opts.magazineId.
 *
 * @param opts - The options for fetching magazine issues' additional data.
 * @returns A promise that resolves to an array of magazine issues.
 * @throws If there is an error while fetching the magazine issues.
 */
export function getAllMagazineIssues(
  opts: RequestOpts = {}
): Promise<MagazineIssue[]> {
  const scope = getScopeFromParams(opts, magazineIssueScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`MagazineFeatures\`
                 WHERE MagazineIssue.\`id\` = \`magazineIssueId\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};
  if (opts.magazineId) {
    queryOpts.where = { magazineId: opts.magazineId };
  }

  return MagazineIssue.scope(scope)
    .findAll(queryOpts)
    .then((issues) => issues)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single magazine issue by ID with additional data based on the
 * provided options.
 *
 * @param id - The ID of the magazine issue to fetch.
 * @param opts - The options for fetching the additional magazine issue data.
 * @returns A promise that resolves to the fetched magazine issue or null if
 * not found.
 * @throws If there is an error while fetching the magazine issue.
 */
export function getMagazineIssueById(
  id: number,
  opts: RequestOpts = {}
): Promise<MagazineIssue | null> {
  const scope = getScopeFromParams(opts, magazineIssueScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`MagazineFeatures\`
                 WHERE MagazineIssue.\`id\` = \`magazineIssueId\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return MagazineIssue.scope(scope)
    .findByPk(id, queryOpts)
    .then((issue) => issue)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates a single magazine issue in the database based on the provided ID and
 * data.
 *
 * @param id - The ID of the magazine issue to update.
 * @param data - The updated magazine issue data.
 * @returns A promise that resolves to the updated magazine issue.
 * @throws If the magazine issue is not found.
 */
export function updateMagazineIssueById(
  id: number,
  data: MagazineIssueUpdateData
): Promise<MagazineIssue | null> {
  return MagazineIssue.findByPk(id)
    .then((issue) => {
      if (!issue) {
        throw new Error("Magazine issue not found");
      }
      return issue.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a single magazine issue from the database based on the provided ID.
 *
 * @param id - The ID of the magazine issue to delete.
 * @returns A promise that resolves to the number of deleted magazine issues.
 */
export function deleteMagazineIssueById(id: number) {
  return MagazineIssue.destroy({ where: { id } });
}
