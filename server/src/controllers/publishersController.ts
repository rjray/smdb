/*
  Exegesis controller for all operations under /api/publishers.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { Publishers } from "db";
import { Publisher } from "models";
import { PublisherFetchOpts } from "types/publisher";

// Convert query parameters into a `PublisherFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: PublisherFetchOpts = {
    series: false,
  };
  if (query.series) opts.series = true;

  return opts;
}

/**
  POST /publishers

  Creates a new publisher using the form data in `requestBody`.

  @param context - The Exegesis context object.
  @returns A promise that resolves to the created publisher.
 */
export function createPublisher(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Publishers.addPublisher(body).then((publisher) =>
    res.status(201).pureJson(publisher.clean())
  );
}

/**
 * GET /publishers
 *
 * Retrieves all publishers with additional data based on the provided query
 * options.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of publishers.
 */
export function getAllPublishers(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Publishers.fetchAllPublishers(opts).then((results: Publisher[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/**
 * GET /publishers/{id}
 *
 * Retrieves a publisher by its ID with additional data based on the provided
 * query options.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the publisher object if found, or a 404
 * response if not found.
 */
export function getPublisherById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Publishers.fetchOnePublisher(id, opts).then((publisher) => {
    if (publisher) return res.status(200).pureJson(publisher.clean());
    else return res.status(404).end();
  });
}

/**
 * DELETE /publishers/{id}
 *
 * Deletes a publisher from the database based on the provided ID.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that resolves to void.
 */
export function deletePublisherById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Publishers.deletePublisher(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
