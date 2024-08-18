/*
  Exegesis controller for all operations under /api/featurefeaturetags.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { FeatureTags } from "db";
import { FeatureTag } from "models";
import { FeatureTagFetchOpts } from "types/featuretag";

// Convert query parameters into a `FeatureTagFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: FeatureTagFetchOpts = {
    references: false,
    referenceCount: false,
  };
  if (query.references) opts.references = true;
  if (query.referenceCount) opts.referenceCount = true;

  return opts;
}

/*
  GET /featuretags

  Return all featuretags. Return value is a list of `FeatureTag` objects.
 */
export function getAllFeatureTags(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return FeatureTags.fetchAllFeatureTags(opts).then((results: FeatureTag[]) =>
    res.status(200).pureJson(results.map((featuretag) => featuretag.clean()))
  );
}

/*
  GET /featuretags/{id}

  Return a single feature tag based on the value of `id`. Return value is a
  single `FeatureTag` object.
 */
export function getFeatureTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return FeatureTags.fetchOneFeatureTag(id, opts).then((featuretag) => {
    if (featuretag) return res.status(200).pureJson(featuretag.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /featuretags/{id}

  Delete a single featuretag based on the value of `id`.
 */
export function deleteFeatureTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return FeatureTags.deleteFeatureTag(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
