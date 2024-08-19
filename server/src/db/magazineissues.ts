/*
  Database operations focused on the MagazineIssue model.
 */

import { match } from "ts-pattern";
import { BaseError, FindOptions } from "sequelize";

import { Sequelize } from "database";
import { MagazineIssue } from "models";
import { MagazineIssueFetchOpts } from "types/magazineissue";

// Derive a `scope` value based on the Boolean query parameters
function getScopeFromParams(params: MagazineIssueFetchOpts): string {
  return match([params.magazine, params.references])
    .returnType<string>()
    .with([false, false], () => "")
    .with([false, true], () => "references")
    .with([true, false], () => "magazine")
    .with([true, true], () => "full")
    .run();
}

/*
  Fetch a single magazine issue by ID. Uses query parameters to opt-in on
  magazine data, references, and/or reference count.
 */
export function fetchOneMagazineIssue(
  id: number,
  opts: MagazineIssueFetchOpts
): Promise<MagazineIssue | null> {
  const scope = getScopeFromParams(opts);
  const queryOpts: FindOptions = opts.referenceCount
    ? {
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM \`MagazineFeatures\`
                 WHERE MagazineIssue.\`id\` = \`magazineIssueId\`)`
              ),
              "referenceCount",
            ],
          ],
        },
      }
    : {};

  return MagazineIssue.scope(scope)
    .findByPk(id, queryOpts)
    .then((issue) => issue)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/*
  Delete a single magazine issue from the database (indicated by ID).
 */
export function deleteMagazineIssue(id: number) {
  return MagazineIssue.destroy({ where: { id } });
}
