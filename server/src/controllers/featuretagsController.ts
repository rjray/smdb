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

/**
  POST /featuretags

  Creates a new feature tag.

  @param context - The Exegesis context object.
  @returns A promise that resolves to the created feature tag.
 */
export function createFeatureTag(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return FeatureTags.addFeatureTag(body).then((featuretag) =>
    res.status(201).pureJson(featuretag.clean())
  );
}

/**
 * GET /featuretags
 *
 * Retrieves all feature tags based on the provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of feature tags.
 */
export function getAllFeatureTags(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return FeatureTags.fetchAllFeatureTags(opts).then((results: FeatureTag[]) =>
    res.status(200).pureJson(results.map((featuretag) => featuretag.clean()))
  );
}

/**
 * GET /featuretags/{id}
 *
 * Retrieves a single feature tag based on the value of `id`.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the fetched feature tag or a 404 if not
 * found.
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

/**
 * DELETE /featuretags/{id}
 *
 * Deletes a single feature tag based on the value of `id`.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to a 200 if the feature tag was deleted, or
 * a 404 if not found.
 */
export function deleteFeatureTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return FeatureTags.deleteFeatureTag(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
