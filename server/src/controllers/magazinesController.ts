/*
  Exegesis controller for all operations under /api/magazines.
 */

import { ExegesisContext } from "exegesis-express";

import { Magazines } from "db";
import { Magazine } from "models";
import { queryToRequestOpts } from "utils";

/**
 * POST /magazines
 *
 * Creates a new magazine using the form data in `requestBody`.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the created magazine.
 */
export function createMagazine(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Magazines.addMagazine(body).then((magazine) =>
    res.status(201).pureJson(magazine.clean())
  );
}

/**
 * GET /magazines
 *
 * Retrieves all magazines with additional data based on the provided query
 * parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of magazines.
 */
export function getAllMagazines(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return Magazines.fetchAllMagazines(opts).then((results: Magazine[]) =>
    res.status(200).pureJson(results.map((magazine) => magazine.clean()))
  );
}

/**
 * GET /magazines/{id}
 *
 * Retrieves a magazine by its ID with additional data based on the provided
 * query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the magazine data if found, or a 404
 * response if not found.
 */
export function getMagazineById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return Magazines.fetchOneMagazine(id, opts).then((magazine) => {
    if (magazine) return res.status(200).pureJson(magazine.clean());
    else return res.status(404).end();
  });
}

export function getMostRecentUpdatedMagazines(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return Magazines.fetchRecentlyUpdatedMagazines(opts).then(
    (results: Magazine[]) =>
      res.status(200).pureJson(results.map((magazine) => magazine.clean()))
  );
}

/**
 * DELETE /magazines/{id}
 *
 * Deletes a magazine by its ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the HTTP response.
 */
export function deleteMagazineById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Magazines.deleteMagazine(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
