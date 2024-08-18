/*
  Database operations focused on the Publisher model.
 */

import { BaseError } from "sequelize";

import { Publisher } from "models";
import { PublisherFetchOpts } from "types/publisher";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: PublisherFetchOpts): string {
  return params.series ? "series" : "";
}

/*
  Fetch all feature tags. Uses query parameters to opt-in on references and/or
  reference count.
 */
export function fetchAllPublishers(
  opts: PublisherFetchOpts
): Promise<Publisher[]> {
  const scope = getScopeFromParams(opts);

  return Publisher.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Fetch a single feature tag by ID. Uses query parameters to opt-in on
  references and/or reference count.
 */
export function fetchOnePublisher(
  id: number,
  opts: PublisherFetchOpts
): Promise<Publisher | null> {
  const scope = getScopeFromParams(opts);

  return Publisher.scope(scope)
    .findByPk(id)
    .then((publisher) => publisher)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single feature tag from the database (indicated by ID).
 */
export function deletePublisher(id: number) {
  return Publisher.destroy({ where: { id } });
}
