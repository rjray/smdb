/*
  Exegesis controller for all operations under /api/featurefeaturetags.
 */

import { ExegesisContext } from "exegesis-express";

import { FeatureTags } from "../db";
import { FeatureTag } from "../models";
import {
  FeatureTagUpdateData,
  FeatureTagNewData,
} from "@smdb-types/feature-tags";
import { queryToRequestOpts } from "../utils";

/**
  POST /featuretags

  Creates a new feature tag.

  @param context - The Exegesis context object.
  @returns A promise that resolves to the created feature tag.
 */
export function createFeatureTag(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return FeatureTags.createFeatureTag(body as FeatureTagNewData).then(
    (featuretag) => res.status(201).pureJson(featuretag.clean())
  );
}

/**
 * GET /featuretags
 *
 * Retrieves all feature tags from the database with additional data based on
 * the provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of feature tags.
 */
export function getAllFeatureTags(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return FeatureTags.getAllFeatureTags(opts).then((results: FeatureTag[]) =>
    res.status(200).pureJson(results.map((featuretag) => featuretag.clean()))
  );
}

/**
 * GET /featuretags/{id}
 *
 * Retrieves a single feature tag based on the value of `id`, with additional
 * data based on the provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the fetched feature tag or a 404 if not
 * found.
 */
export function getFeatureTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return FeatureTags.getFeatureTagById(id, opts).then((featuretag) => {
    if (featuretag) return res.status(200).pureJson(featuretag.clean());
    else return res.status(404).end();
  });
}

/**
 * PUT /featuretags/{id}
 *
 * Updates a single feature tag based on the value of `id`.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that sets the response status and body.
 * @throws If an error occurs while updating the feature tag.
 */
export function updateFeatureTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return FeatureTags.updateFeatureTagById(
    id,
    body as FeatureTagUpdateData
  ).then((featuretag) => {
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

  return FeatureTags.deleteFeatureTagById(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
