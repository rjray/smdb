/*
  Database operations focused on the MagazineIssue model.
 */

import { match } from "ts-pattern";
import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { MagazineIssue } from "models";
import { MagazineIssueFetchOpts } from "types/magazineissue";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: MagazineIssueFetchOpts): string {
  return match([params.magazine, params.references])
    .returnType<string>()
    .with([false, false], () => "")
    .with([false, true], () => "references")
    .with([true, false], () => "magazine")
    .with([true, true], () => "full")
    .run();
}

type MagazineIssueData = {
  issue: string;
  magazineId: number;
};

/**
 * Adds a magazine issue to the database.
 *
 * @param data - The magazine issue data to be added.
 * @returns A promise that resolves to the created magazine issue.
 */
export function addMagazineIssue(
  data: MagazineIssueData
): Promise<MagazineIssue> {
  return MagazineIssue.create(data);
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
export function fetchOneMagazineIssue(
  id: number,
  opts: MagazineIssueFetchOpts
): Promise<MagazineIssue | null> {
  const scope = getScopeFromParams(opts);
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
 * Deletes a single magazine issue from the database based on the provided ID.
 *
 * @param id - The ID of the magazine issue to delete.
 * @returns A promise that resolves to the number of deleted magazine issues.
 */
export function deleteMagazineIssue(id: number) {
  return MagazineIssue.destroy({ where: { id } });
}
