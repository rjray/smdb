/*
  Exegesis controller for all operations under /api/series.
 */

import { ExegesisContext } from "exegesis-express";

import { Series as SeriesDB } from "db";
import { Series } from "models";
import { queryToRequestOpts } from "utils";

/*
  POST /series

  Creates a new series using the form data in `requestBody`.

  @param context - The Exegesis context object.
  @returns A promise that resolves to the created series.
 */
export function createSeries(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return SeriesDB.createSeries(body).then((series) =>
    res.status(201).pureJson(series.clean())
  );
}

/**
 * GET /series
 *
 * Retrieves all series with additional data based on the provided query
 * parameters.
 *
 * @param {ExegesisContext} context - The ExegesisContext object containing the
 * request context.
 * @returns {Promise<void>} - A promise that resolves once the series have been
 * retrieved and processed.
 */
export function getAllSeries(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return SeriesDB.getAllSeries(opts).then((results: Series[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/**
 * GET /series/{id}
 *
 * Retrieves a series by its ID with additional data based on the provided
 * query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the series object if found, or a 404
 * response if not found.
 */
export function getSeriesById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return SeriesDB.getSeriesById(id, opts).then((series) => {
    if (series) return res.status(200).pureJson(series.clean());
    else return res.status(404).end();
  });
}

/**
 * PUT /series/{id}
 *
 * Updates a series in the database based on the provided ID and form data.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that sets the response status and body.
 * @throws If an error occurs while updating the series.
 */
export function updateSeriesById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return SeriesDB.updateSeriesById(id, body).then((series) => {
    if (series) return res.status(200).pureJson(series.clean());
    else return res.status(404).end();
  });
}

/**
 * DELETE /series/{id}
 *
 * Deletes a series from the database based on the provided ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to void.
 */
export function deleteSeriesById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return SeriesDB.deleteSeriesById(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
