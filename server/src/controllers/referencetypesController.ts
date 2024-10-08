/*
  Exegesis controller for all operations under /api/referencetypes.
 */

import { ExegesisContext } from "exegesis-express";

import { ReferenceTypes } from "db";
import { ReferenceType } from "models";
import { queryToRequestOpts } from "utils";

/**
 * POST /referencetypes
 *
 * Create a new reference type based on the provided request body.
 *
 * @param context - The Exegesis context.
 * @returns A promise that resolves to the created reference type.
 */
export function createReferenceType(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return ReferenceTypes.createReferenceType(body).then((referenceType) =>
    res.status(201).pureJson(referenceType.clean())
  );
}

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

/**
 * PUT /referencetypes/{id}
 *
 * Updates a reference type in the database based on the provided ID and form
 * data.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that sets the response status and body.
 * @throws If an error occurs while updating the reference type.
 */
export function updateReferenceTypeById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return ReferenceTypes.updateReferenceTypeById(id, body).then(
    (referenceType) => {
      if (referenceType) return res.status(200).pureJson(referenceType.clean());
      else return res.status(404).end();
    }
  );
}
