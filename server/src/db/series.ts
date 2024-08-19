/*
  Database operations focused on the Series model.
 */

import { BaseError } from "sequelize";

import { Series } from "models";
import { SeriesFetchOpts } from "types/series";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: SeriesFetchOpts): string {
  return params.publisher ? "publisher" : "";
}

/*
  Fetch all series. Uses query parameters to opt-in on publisher.
 */
export function fetchAllSeries(opts: SeriesFetchOpts): Promise<Series[]> {
  const scope = getScopeFromParams(opts);

  return Series.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Fetch a single series by ID. Uses query parameters to opt-in on publisher.
 */
export function fetchOneSeries(
  id: number,
  opts: SeriesFetchOpts
): Promise<Series | null> {
  const scope = getScopeFromParams(opts);

  return Series.scope(scope)
    .findByPk(id)
    .then((series) => series)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single series from the database (indicated by ID).
 */
export function deleteSeries(id: number) {
  return Series.destroy({ where: { id } });
}
