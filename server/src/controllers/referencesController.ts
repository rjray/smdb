/*
  Exegesis controller for all operations under /api/references.
 */

import { ExegesisContext } from "exegesis-express";

import { References } from "db";
import { Reference } from "models";
import { ReferenceUpdateData, ReferenceNewData } from "types/reference";
import { queryToRequestOpts } from "utils";

/**
 * POST /references
 *
 * Creates a new reference based on the provided request body.
 *
 * @param context - The Exegesis context.
 * @returns A promise that resolves to the created reference.
 */
export function createReference(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return References.createReference(body as ReferenceNewData).then(
    (reference) => res.status(201).pureJson(reference.clean())
  );
}

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

  return References.getAllReferences(opts).then((results: Reference[]) =>
    res.status(200).pureJson(results.map((reference) => reference.clean()))
  );
}

/**
 * GET /references/{id}
 *
 * Retrieve a reference by its ID with additional data based on the provided
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

  return References.getReferenceById(id, opts).then((reference) => {
    if (reference) return res.status(200).pureJson(reference.clean());
    else return res.status(404).end();
  });
}

/**
 * PUT /references/{id}
 *
 * Update a reference by its ID and the provided request body.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the updated reference.
 */
export function updateReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return References.updateReferenceById(id, body as ReferenceUpdateData).then(
    (reference) => {
      if (reference) return res.status(200).pureJson(reference.clean());
      else return res.status(404).end();
    }
  );
}

/**
 * Delete a reference by its ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the HTTP response.
 */
export function deleteReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return References.deleteReferenceById(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
