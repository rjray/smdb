/*
  Exegesis controller for all operations under /api/publishers.
 */

import { ExegesisContext } from "exegesis-express";

import { Publishers } from "db";
import { Publisher } from "models";
import { queryToRequestOpts } from "utils";

/**
  POST /publishers

  Creates a new publisher using the form data in `requestBody`.

  @param context - The Exegesis context object.
  @returns A promise that resolves to the created publisher.
 */
export function createPublisher(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Publishers.createPublisher(body).then((publisher) =>
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

  const opts = queryToRequestOpts(query);

  return Publishers.getAllPublishers(opts).then((results: Publisher[]) =>
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

  const opts = queryToRequestOpts(query);

  return Publishers.getPublisherById(id, opts).then((publisher) => {
    if (publisher) return res.status(200).pureJson(publisher.clean());
    else return res.status(404).end();
  });
}

/**
 * PUT /publishers/{id}
 *
 * Updates a publisher in the database based on the provided ID and form data.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that sets the response status and body.
 * @throws If an error occurs while updating the publisher.
 */
export function updatePublisherById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return Publishers.updatePublisherById(id, body).then((publisher) => {
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

  return Publishers.deletePublisherById(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
