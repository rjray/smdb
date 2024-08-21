/*
  Database operations focused on the Author model.
 */

import { match } from "ts-pattern";
import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Author, AuthorAlias } from "models";
import { AuthorFetchOpts } from "types/author";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: AuthorFetchOpts): string {
  return match([params.aliases, params.references])
    .returnType<string>()
    .with([false, false], () => "")
    .with([false, true], () => "references")
    .with([true, false], () => "aliases")
    .with([true, true], () => "full")
    .run();
}

type AuthorData = {
  name: string;
  aliases?: { name: string }[];
};

/**
 * Adds an author to the database.
 *
 * @param data - The author data to be added.
 * @returns A promise that resolves to the created author.
 */
export function addAuthor(data: AuthorData): Promise<Author> {
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
export function fetchAllAuthors(opts: AuthorFetchOpts): Promise<Author[]> {
  const scope = getScopeFromParams(opts);
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
  opts: AuthorFetchOpts
): Promise<Author | null> {
  const scope = getScopeFromParams(opts);
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
 * Deletes a single author from the database based on the provided ID.
 *
 * @param id - The ID of the author to be deleted.
 * @returns A promise that resolves when the author is successfully deleted.
 */
export function deleteAuthor(id: number) {
  return Author.destroy({ where: { id } });
}
