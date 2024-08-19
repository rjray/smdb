/*
  Exegesis controller for all operations under /api/series.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { Series as SeriesDB } from "db";
import { Series } from "models";
import { SeriesFetchOpts } from "types/series";

// Convert query parameters into a `SeriesFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: SeriesFetchOpts = {
    publisher: false,
  };
  if (query.publisher) opts.publisher = true;

  return opts;
}

/*
  GET /series

  Return all series. Return value is a list of `Series` objects.
 */
export function getAllSeries(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return SeriesDB.fetchAllSeries(opts).then((results: Series[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/*
  GET /series/{id}

  Return a single series based on the value of `id`. Return value is a single
  `Series` object.
 */
export function getSeriesById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return SeriesDB.fetchOneSeries(id, opts).then((series) => {
    if (series) return res.status(200).pureJson(series.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /series/{id}

  Delete a single series based on the value of `id`.
 */
export function deleteSeriesById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return SeriesDB.deleteSeries(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
