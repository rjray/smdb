/*
  Exegesis controller for all operations under /api/referencetypes.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { ReferenceTypes } from "db";
import { ReferenceType } from "models";
import { ReferenceTypeFetchOpts } from "types/referencetype";

// Convert query parameters into a `TagFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: ReferenceTypeFetchOpts = {
    referenceCount: false,
  };
  if (query.referenceCount) opts.referenceCount = true;

  return opts;
}

/*
  GET /referencetypes

  Return all reference types. Return value is a list of `ReferenceType` objects.
 */
export function getAllReferenceTypes(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return ReferenceTypes.fetchAllReferenceTypes(opts).then(
    (results: ReferenceType[]) =>
      res.status(200).pureJson(results.map((rt) => rt.clean()))
  );
}

/*
  GET /referencetypess/{id}

  Return a single reference type based on the value of `id`. Return value is a
  Promise of a single `ReferenceTypeRecord` object or `null`.
 */
export function getReferenceTypeById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return ReferenceTypes.fetchOneReferenceType(id, opts).then(
    (referenceType) => {
      if (referenceType) return res.status(200).pureJson(referenceType.clean());
      else return res.status(404).end();
    }
  );
}
