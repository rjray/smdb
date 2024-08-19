/*
  Exegesis controller for all operations under /api/magazines.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { Magazines } from "db";
import { Magazine } from "models";
import { MagazineFetchOpts } from "types/magazine";

// Convert query parameters into a `MagazineFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: MagazineFetchOpts = {
    issues: false,
    issueCount: false,
  };
  if (query.issues) opts.issues = true;
  if (query.issueCount) opts.issueCount = true;

  return opts;
}

/*
  GET /magazines

  Return all magazines. Return value is a list of `Magazine` objects.
 */
export function getAllMagazines(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Magazines.fetchAllMagazines(opts).then((results: Magazine[]) =>
    res.status(200).pureJson(results.map((magazine) => magazine.clean()))
  );
}

/*
  GET /magazines/{id}

  Return a single magazine based on the value of `id`. Return value is a single
  `Magazine` object.
 */
export function getMagazineById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Magazines.fetchOneMagazine(id, opts).then((magazine) => {
    if (magazine) return res.status(200).pureJson(magazine.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /magazines/{id}

  Delete a single magazine based on the value of `id`.
 */
export function deleteMagazineById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Magazines.deleteMagazine(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
