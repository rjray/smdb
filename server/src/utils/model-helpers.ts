/**
 * Utility functions for working with Sequelize models.
 */

import { ParametersMap } from "exegesis-express";

export type RequestOpts = Record<string, unknown>;

/**
 * Converts a query object and an array of keys into RequestOpts object.
 *
 * @param query - The query object containing unknown values.
 * @returns The RequestOpts object generated from the query and keys.
 */
export function queryToRequestOpts(query: ParametersMap<unknown>): RequestOpts {
  const opts: RequestOpts = { ...query };

  return opts;
}

/**
 * Derives the scope from the provided RequestOpts object.
 *
 * @param params - The request options parameters.
 * @param omitDefault - Whether to omit the default scope. Default is false.
 * @returns An array of strings representing the scope.
 */
export function getScopeFromParams(
  params: RequestOpts,
  scopes: Array<string>,
  omitDefault = false
): Array<string> {
  const scope = [];
  if (!omitDefault) scope.push("defaultScope");

  for (const key of scopes) {
    if (params[key]) scope.push(key);
  }

  return scope;
}
