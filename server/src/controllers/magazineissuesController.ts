/*
  Exegesis controller for all operations under /api/magazineissues.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { MagazineIssues } from "db";
import { MagazineIssueFetchOpts } from "types/magazineissue";

// Convert query parameters into a `MagazineIssueFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: MagazineIssueFetchOpts = {
    magazine: false,
    references: false,
    referenceCount: false,
  };
  if (query.magazine) opts.magazine = true;
  if (query.references) opts.references = true;
  if (query.referenceCount) opts.referenceCount = true;

  return opts;
}

/*
  GET /magazineissues/{id}

  Return a single magazine issue based on the value of `id`. Return value is a
  single `MagazineIssue` object.
 */
export function getMagazineIssueById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return MagazineIssues.fetchOneMagazineIssue(id, opts).then((issue) => {
    if (issue) return res.status(200).pureJson(issue.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /magazineissues/{id}

  Delete a single magazineissue based on the value of `id`.
 */
export function deleteMagazineIssueById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return MagazineIssues.deleteMagazineIssue(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
