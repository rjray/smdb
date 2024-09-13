/*
  Database operations focused on the ReferenceType model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { ReferenceType } from "models";
import { RequestOpts } from "utils";

type ReferenceTypeData = {
  name: string;
  description: string;
  notes?: string | null;
};

/**
 * Adds a reference type to the database.
 *
 * @param data - The reference type data to be added.
 * @returns A promise that resolves to the created reference type.
 */
export function createReferenceType(
  data: ReferenceTypeData
): Promise<ReferenceType> {
  return ReferenceType.create(data);
}

/**
 * Fetches all reference types with additional data based on the provided
 * options.
 *
 * @param opts - The options for fetching reference types' additional data.
 * @returns A promise that resolves to an array of reference types.
 * @throws If there is an error while fetching the reference types.
 */
export function getAllReferenceTypes(
  opts: RequestOpts
): Promise<ReferenceType[]> {
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

  return ReferenceType.findAll(queryOpts).catch((error: BaseError) => {
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
  opts: RequestOpts
): Promise<ReferenceType | null> {
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

  return ReferenceType.findByPk(id, queryOpts)
    .then((referenceType) => referenceType)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates a single reference type in the database based on the provided ID and
 * data.
 *
 * @param id - The ID of the reference type to update.
 * @param data - The updated reference type data.
 * @returns A promise that resolves to the updated reference type.
 * @throws If there is an error while updating the reference type.
 */
export function updateReferenceTypeById(
  id: number,
  data: ReferenceTypeData
): Promise<ReferenceType> {
  return ReferenceType.findByPk(id)
    .then((referenceType) => {
      if (!referenceType) {
        throw new Error("Reference type not found");
      }
      return referenceType.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}
