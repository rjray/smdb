/*
  Database operations focused on the Author model.
 */

import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Author, AuthorAlias } from "models";
import { AuthorUpdateData, AuthorNewData } from "types/author";
import { RequestOpts, getScopeFromParams } from "utils";

/// The scopes that can be fetched for authors.
const authorScopes = ["references", "aliases"];

/**
 * Adds an author to the database.
 *
 * @param data - The author data to be added.
 * @returns A promise that resolves to the created author.
 */
export function addAuthor(data: AuthorNewData): Promise<Author> {
  if (data.aliases) {
    return Author.create(data, {
      include: [AuthorAlias],
    });
  } else {
    return Author.create(data);
  }
}

/**
 * Fetches all authors with additional data based on the provided options.
 *
 * @param opts - The options for fetching authors' additional data.
 * @returns A promise that resolves to an array of authors.
 * @throws If there is an error while fetching authors.
 */
export function fetchAllAuthors(opts: RequestOpts): Promise<Author[]> {
  const scope = getScopeFromParams(opts, authorScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`AuthorsReferences\`
                 WHERE \`authorId\` = Author.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return Author.scope(scope)
    .findAll(queryOpts)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single author by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the author to fetch.
 * @param opts - The options for fetching the author's additional data.
 * @returns A Promise that resolves to the fetched author or null if not found.
 * @throws An error if there was an issue fetching the author.
 */
export function fetchOneAuthor(
  id: number,
  opts: RequestOpts
): Promise<Author | null> {
  const scope = getScopeFromParams(opts, authorScopes);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`AuthorsReferences\`
                 WHERE \`authorId\` = Author.\`id\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return Author.scope(scope)
    .findByPk(id, queryOpts)
    .then((author) => author)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates an author in the database. If the data given includes aliases, they
 * will be updated as well. Throws an error if the author is not found.
 *
 * @param id - The ID of the author to update.
 * @param data - The data to update the author with.
 * @returns A promise that resolves to the updated author.
 */
export function updateAuthor(
  id: number,
  data: AuthorUpdateData
): Promise<Author> {
  return Author.findByPk(id)
    .then((author) => {
      if (!author) {
        throw new Error("Author not found");
      }

      if (data.aliases && data.aliases.length) {
        const aliases = data.aliases.map((a) => a.name);
        delete data.aliases;

        return author
          .removeAliases()
          .then(() => author.addAliases(aliases))
          .then(() => author.update(data));
      } else {
        return author.update(data);
      }
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a single author from the database based on the provided ID.
 *
 * @param id - The ID of the author to be deleted.
 * @returns A promise that resolves when the author is successfully deleted.
 */
export function deleteAuthor(id: number) {
  return Author.destroy({ where: { id } });
}
