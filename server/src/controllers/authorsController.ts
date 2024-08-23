/*
  Exegesis controller for all operations under /api/authors.
 */

import { ExegesisContext, ParametersMap } from "exegesis-express";

import { Authors } from "db";
import { Author } from "models";
import { AuthorFetchOpts } from "types/author";

// Convert query parameters into a `AuthorFetchOpts` instance.
function queryToFetchOpts(query: ParametersMap<boolean>) {
  const opts: AuthorFetchOpts = {
    aliases: false,
    references: false,
    referenceCount: false,
  };
  if (query.aliases) opts.aliases = true;
  if (query.references) opts.references = true;
  if (query.referenceCount) opts.referenceCount = true;

  return opts;
}

/**
 * POST /authors
 *
 * Creates a new author based on the provided request body.
 *
 * @param context - The Exegesis context.
 * @returns A promise that resolves to the created author.
 */
export function createAuthor(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Authors.addAuthor(body).then((author) =>
    res.status(201).pureJson(author.clean())
  );
}

/**
 * GET /authors
 *
 * Retrieves all authors from the database with additional data based on the
 * provided query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to an array of authors.
 */
export function getAllAuthors(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Authors.fetchAllAuthors(opts).then((results: Author[]) =>
    res.status(200).pureJson(results.map((author) => author.clean()))
  );
}

/**
 * GET /authors/{id}
 *
 * Retrieves an author by their ID with additional data based on the provided
 * query parameters.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the author's information if found, or a
 * 404 response if not found.
 */
export function getAuthorById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Authors.fetchOneAuthor(id, opts).then((author) => {
    if (author) return res.status(200).pureJson(author.clean());
    else return res.status(404).end();
  });
}

/**
 * DELETE /authors/{id}
 *
 * Deletes an author from the database based on the provided ID.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that resolves to void.
 */
export function deleteAuthorById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Authors.deleteAuthor(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
