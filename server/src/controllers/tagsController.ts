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

/**
 * POST /tags
 *
 * Creates a new tag.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the created tag.
 */
export function createTag(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Tags.addTag(body).then((tag) => res.status(201).pureJson(tag.clean()));
}

/**
 * GET /tags
 *
 * Retrieves all tags from the database based on the provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of tags.
 */
export function getAllTags(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Tags.fetchAllTags(opts).then((results: Tag[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/**
 * GET /tags/{id}
 *
 * Retrieves a tag by its ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the retrieved tag or null if not found.
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

/**
 * DELETE /tags/{id}
 *
 * Deletes a tag from the database based on the provided ID.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to void.
 */
export function deleteTagById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Tags.deleteTag(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
