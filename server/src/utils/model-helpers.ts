/**
 * Utility functions for working with Sequelize models.
 */

import { ParametersMap } from "exegesis-express";

export type FetchOpts = Record<string, boolean>;

/**
 * Converts a query object and an array of keys into FetchOpts object.
 *
 * @param query - The query object containing boolean values.
 * @param keys - The array of keys to be converted into FetchOpts object.
 * @returns The FetchOpts object generated from the query and keys.
 */
export function queryToFetchOpts(
  query: ParametersMap<boolean>,
  keys: string[]
): FetchOpts {
  const opts: FetchOpts = {};
  for (const key of keys) {
    opts[key] = query[key] || false;
  }

  return opts;
}

/**
 * Derives the scope from the provided FetchOpts object.
 *
 * @param params - The fetch options parameters.
 * @param omitDefault - Whether to omit the default scope. Default is false.
 * @returns An array of strings representing the scope.
 */
export function getScopeFromParams(
  params: FetchOpts,
  omitDefault = false
): Array<string> {
  const scope = [];
  if (!omitDefault) scope.push("defaultScope");

  for (const key in params) {
    if (params[key]) scope.push(key);
  }

  return scope;
}
