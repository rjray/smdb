/*
  Database operations focused on the Reference model.
 */

import { match } from "ts-pattern";
import { BaseError } from "sequelize";

import { Reference } from "models";
import { ReferenceFetchOpts } from "types/reference";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: ReferenceFetchOpts): Array<string> {
  return match([params.authors, params.tags])
    .returnType<string[]>()
    .with([false, false], () => ["defaultScope"])
    .with([false, true], () => ["defaultScope", "tags"])
    .with([true, false], () => ["defaultScope", "authors"])
    .with([true, true], () => ["defaultScope", "authors", "tags"])
    .run();
}

/**
 * Fetches all references with additional data based on the provided options.
 *
 * @param opts - The options for fetching references' additional data.
 * @returns A promise that resolves to an array of references.
 * @throws If there is an error while fetching the references.
 */
export function fetchAllReferences(
  opts: ReferenceFetchOpts
): Promise<Reference[]> {
  const scope = getScopeFromParams(opts);

  return Reference.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single reference by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the reference to fetch.
 * @param opts - The options for fetching the reference's additional data.
 * @returns A promise that resolves to the fetched reference or null if not
 * found.
 * @throws If there is an error while fetching the reference.
 */
export function fetchOneReference(
  id: number,
  opts: ReferenceFetchOpts
): Promise<Reference | null> {
  const scope = getScopeFromParams(opts);

  return Reference.scope(scope)
    .findByPk(id)
    .then((reference) => reference)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a reference from the database based on the provided ID.
 *
 * @param id - The ID of the reference to delete.
 * @returns A promise that resolves to the number of deleted references.
 */
export function deleteReference(id: number) {
  return Reference.destroy({ where: { id } });
}
