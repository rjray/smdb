/*
  Database operations focused on the Author model.
 */

import { match } from "ts-pattern";
import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { Author } from "models";
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

/*
  Fetch all authors. Uses query parameters to opt-in on aliases, references,
  and/or reference count.
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

/*
  Fetch a single author by ID. Uses query parameters to opt-in on aliases,
  references, and/or reference count.
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

/*
  Delete a single author from the database (indicated by ID). Will delete
  aliases and author-reference relations, but not references themselves.
 */
export function deleteAuthor(id: number) {
  return Author.destroy({ where: { id } });
}
