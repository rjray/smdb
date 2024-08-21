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

/*
  POST /authors

  Create a new author. The request body should be a JSON object with the name
  of the author. The response body will be the created author object. If the
  request data includes an `aliases` array, the author's aliases will also be
  created.
 */
export function createAuthor(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return Authors.addAuthor(body).then((author) =>
    res.status(201).pureJson(author.clean())
  );
}

/*
  GET /authors

  Return all authors. Return value is a list of `Author` objects.
 */
export function getAllAuthors(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Authors.fetchAllAuthors(opts).then((results: Author[]) =>
    res.status(200).pureJson(results.map((author) => author.clean()))
  );
}

/*
  GET /authors/{id}

  Return a single author based on the value of `id`. Return value is a single
  `Author` object.
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

/*
  DELETE /authors/{id}

  Delete a single author based on the value of `id`.
 */
export function deleteAuthorById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Authors.deleteAuthor(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
