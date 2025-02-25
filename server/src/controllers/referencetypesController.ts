/*
  Exegesis controller for all operations under /api/referencetypes.

  There are no POST, PUT or DELETE endpoints for reference types. Reference
  types are created when the database is initialized, and are immutable.
 */

import { ExegesisContext } from "exegesis-express";

import { ReferenceTypes } from "db";
import { ReferenceType } from "models";
import { queryToRequestOpts } from "utils";

/**
 * GET /referencetypes
 *
 * Retrieves all reference types with additional data based on the provided
 * query options.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of reference types.
 */
export function getAllReferenceTypes(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return ReferenceTypes.getAllReferenceTypes(opts).then(
    (results: ReferenceType[]) =>
      res.status(200).pureJson(results.map((rt) => rt.clean()))
  );
}

/**
 * Retrieves a reference type by its ID with additional data based on the
 * provided query options.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the reference type if found, or null if
 * not found.
 * @throws If there is an error while retrieving the reference type.
 */
export function getReferenceTypeById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return ReferenceTypes.getReferenceTypeById(id, opts).then((referenceType) => {
    if (referenceType) return res.status(200).pureJson(referenceType.clean());
    else return res.status(404).end();
  });
}
