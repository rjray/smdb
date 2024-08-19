/*
  Database operations focused on the Reference model.
 */

import { BaseError } from "sequelize";

import { Reference } from "models";

/*
  Fetch all references.
 */
export function fetchAllReferences(): Promise<Reference[]> {
  return Reference.findAll().catch((error: BaseError) => {
    throw new Error(error.message);
  });
}

/*
  Fetch a single reference by ID.
 */
export function fetchOneReference(id: number): Promise<Reference | null> {
  return Reference.findByPk(id)
    .then((reference) => reference)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single reference from the database (indicated by ID).
 */
export function deleteReference(id: number) {
  return Reference.destroy({ where: { id } });
}
