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

type PublisherData = {
  name: string;
  notes?: string | null;
};

/**
 * Adds a publisher to the database.
 *
 * @param data - The publisher data to be added.
 * @returns A promise that resolves to the created publisher.
 */
export function addPublisher(data: PublisherData): Promise<Publisher> {
  return Publisher.create(data);
}

/**
 * Fetches all publishers with additional data based on the provided options.
 *
 * @param opts - The options for fetching additional publishers' data.
 * @returns A promise that resolves to an array of publishers.
 * @throws If there is an error while fetching the publishers.
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

/**
 * Fetches a single publisher by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the publisher to fetch.
 * @param opts - The options for fetching additional data for the publisher.
 * @returns A promise that resolves to the fetched publisher or null if not
 * found.
 * @throws If there is an error while fetching the publisher.
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

/**
 * Deletes a single publisher from the database based on the provided ID.
 *
 * @param id - The ID of the publisher to delete.
 * @returns A promise that resolves to the number of deleted publishers.
 */
export function deletePublisher(id: number) {
  return Publisher.destroy({ where: { id } });
}
