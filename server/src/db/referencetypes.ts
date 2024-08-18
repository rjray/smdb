/*
  Database operations focused on the ReferenceType model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { ReferenceType } from "models";
import { ReferenceTypeFetchOpts } from "types/referencetype";

/*
  Fetch all reference types. Uses query parameters to opt-in on reference count.
 */
export function fetchAllReferenceTypes(
  opts: ReferenceTypeFetchOpts
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

/*
  Fetch a single reference type by ID. Uses query parameters to opt-in on
  reference count.
 */
export function fetchOneReferenceType(
  id: number,
  opts: ReferenceTypeFetchOpts
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
