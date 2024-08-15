import { ExegesisContext } from "exegesis-express";

import * as Authors from "db/authors";
import { Author } from "models";

/*
  GET /authors

  Return all authors. Return value is a list of `Author` objects.
 */
export function getAllAuthors(context: ExegesisContext) {
  const { res } = context;

  return Authors.fetchAllAuthors().then((results: Author[]) =>
    res.status(200).pureJson(results.map((author) => author.clean()))
  );
}
