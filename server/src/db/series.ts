/*
  Database operations focused on the Series model.
 */

import { BaseError } from "sequelize";

import { Series } from "models";
import { RequestOpts, getScopeFromParams } from "utils";

/// The scopes that can be fetched for series.
const seriesScopes = ["books", "publisher"];

type SeriesData = {
  name: string;
  notes?: string | null;
  publisherId?: number | null;
};

/**
 * Adds a series to the database.
 *
 * @param data - The series data to be added.
 * @returns A promise that resolves to the created series.
 */
export function createSeries(data: SeriesData): Promise<Series> {
  return Series.create(data);
}

/**
 * Fetches all series with additional data based on the provided options.
 *
 * @param opts - The options for fetching series' additional data.
 * @returns A promise that resolves to an array of series.
 * @throws If there is an error while fetching the series.
 */
export function getAllSeries(opts: RequestOpts): Promise<Series[]> {
  const scope = getScopeFromParams(opts, seriesScopes);

  return Series.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single series by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the series to fetch.
 * @param opts - The options for fetching the series's additional data.
 * @returns A promise that resolves to the fetched series or null if not found.
 * @throws If there is an error while fetching the series.
 */
export function getSeriesById(
  id: number,
  opts: RequestOpts
): Promise<Series | null> {
  const scope = getScopeFromParams(opts, seriesScopes);

  return Series.scope(scope)
    .findByPk(id)
    .then((series) => series)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates a single series in the database based on the provided ID.
 *
 * @param id - The ID of the series to update.
 * @param data - The series data to update.
 * @returns A promise that resolves to the updated series.
 */
export function updateSeriesById(
  id: number,
  data: SeriesData
): Promise<Series> {
  return Series.findByPk(id)
    .then((series) => {
      if (!series) {
        throw new Error("Series not found");
      }
      return series.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a single series from the database based on the provided ID.
 *
 * @param id - The ID of the series to delete.
 * @returns A promise that resolves to the number of deleted series.
 */
export function deleteSeriesById(id: number) {
  return Series.destroy({ where: { id } });
}
