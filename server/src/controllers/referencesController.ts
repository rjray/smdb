/*
  Exegesis controller for all operations under /api/references.
 */

import { ExegesisContext } from "exegesis-express";

import { References } from "db";
import { Reference } from "models";
import { queryToRequestOpts } from "utils";

/**
 * GET /references
 *
 * Fetch all references from the database with additional data based on the
 * provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of references.
 */
export function getAllReferences(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return References.fetchAllReferences(opts).then((results: Reference[]) =>
    res.status(200).pureJson(results.map((rt) => rt.clean()))
  );
}

/**
 * GET /references/{id}
 *
 * Retrieves a reference by its ID with additional data based on the provided
 * query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the fetched reference or null if not
 * found.
 */
export function getReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return References.fetchOneReference(id, opts).then((referenceType) => {
    if (referenceType) return res.status(200).pureJson(referenceType.clean());
    else return res.status(404).end();
  });
}

/**
 * Deletes a reference by its ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the HTTP response.
 */
export function deleteReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return References.deleteReference(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
