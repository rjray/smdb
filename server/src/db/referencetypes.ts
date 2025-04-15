/*
  Database operations focused on the ReferenceType model.

  There are no create, update, or delete operations for reference types. They
  are created when the database is initialized, and are immutable.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "../database";
import { ReferenceType } from "../models";
import { RequestOpts, getScopeFromParams } from "../utils";

// The scopes that can be fetched for feature tags.
const referenceTypeScopes = ["references"];

/**
 * Fetches all reference types with additional data based on the provided
 * options.
 *
 * @param opts - The options for fetching reference types' additional data.
 * @returns A promise that resolves to an array of reference types.
 * @throws If there is an error while fetching the reference types.
 */
export function getAllReferenceTypes(
  opts: RequestOpts = {}
): Promise<ReferenceType[]> {
  const scope = getScopeFromParams(opts, referenceTypeScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`References\`
                 WHERE \`referenceTypeId\` = ReferenceType.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return ReferenceType.scope(scope)
    .findAll(queryOpts)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single reference type by ID with additional data based on the
 * provided options.
 *
 * @param id - The ID of the reference type to fetch.
 * @param opts - The options for fetching the reference type's additional data.
 * @returns A promise that resolves to the fetched reference type or null if
 * not found.
 * @throws If there is an error while fetching the reference type.
 */
export function getReferenceTypeById(
  id: number,
  opts: RequestOpts = {}
): Promise<ReferenceType | null> {
  const scope = getScopeFromParams(opts, referenceTypeScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`References\`
                 WHERE \`referenceTypeId\` = ReferenceType.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return ReferenceType.scope(scope)
    .findByPk(id, queryOpts)
    .then((referenceType) => referenceType)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}
