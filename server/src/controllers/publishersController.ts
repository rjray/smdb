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

/*
  GET /publishers

  Return all publishers. Return value is a list of `Publisher` objects.
 */
export function getAllPublishers(context: ExegesisContext) {
  const { query } = context.params;
  const { res } = context;

  const opts = queryToFetchOpts(query);

  return Publishers.fetchAllPublishers(opts).then((results: Publisher[]) =>
    res.status(200).pureJson(results.map((tag) => tag.clean()))
  );
}

/*
  GET /publishers/{id}

  Return a single publisher based on the value of `id`. Return value is a single
  `Publisher` object.
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

/*
  DELETE /publishers/{id}

  Delete a single publisher based on the value of `id`.
 */
export function deletePublisherById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return Publishers.deletePublisher(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
