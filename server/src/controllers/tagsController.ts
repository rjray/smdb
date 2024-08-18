/*
  Exegesis controller for all operations under /api/tags.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { Tags } from "db";
import { Tag } from "models";
import { TagFetchOpts } from "types/tag";

// Convert query parameters into a `TagFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: TagFetchOpts = {
    references: false,
    referenceCount: false,
  };
  if (query.references) opts.references = true;
  if (query.referenceCount) opts.referenceCount = true;

  return opts;
}

/*
  GET /tags

  Return all tags. Return value is a list of `Tag` objects.
 */
export function getAllTags(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Tags.fetchAllTags(opts).then((results: Tag[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/*
  GET /tags/{id}

  Return a single tag based on the value of `id`. Return value is a single
  `Tag` object.
 */
export function getTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Tags.fetchOneTag(id, opts).then((tag) => {
    if (tag) return res.status(200).pureJson(tag.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /tags/{id}

  Delete a single tag based on the value of `id`.
 */
export function deleteTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Tags.deleteTag(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
