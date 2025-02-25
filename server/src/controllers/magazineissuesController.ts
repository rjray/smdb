/*
  Exegesis controller for all operations under /api/magazineissues.
 */

import { ExegesisContext } from "exegesis-express";
import {
  MagazineIssueNewData,
  MagazineIssueUpdateData,
} from "@smdb-types/magazine-issues";

import { MagazineIssues } from "db";
import { queryToRequestOpts } from "utils";

/**
 * POST /magazineissues
 *
 * Creates a new magazine issue using the form data in `requestBody`.
 *
 * @param context - The Exegesis context object.
 * @returns A promise that resolves to the created magazine issue.
 */
export function createMagazineIssue(context: ExegesisContext) {
  const { res, requestBody: body } = context;

  return MagazineIssues.createMagazineIssue(body as MagazineIssueNewData).then(
    (issue) => res.status(201).pureJson(issue.clean())
  );
}

/**
 * GET /magazineissues/{id}
 *
 * Retrieves a magazine issue by its ID, with additional data based on the
 * provided query parameters.
 *
 * @param context - The ExegesisContext object containing the request
 * parameters.
 * @returns A promise that resolves to the response object with the retrieved
 * magazine issue.
 */
export function getMagazineIssueById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { query } = context.params;
  const { res } = context;

  const opts = queryToRequestOpts(query);

  return MagazineIssues.getMagazineIssueById(id, opts).then((issue) => {
    if (issue) return res.status(200).pureJson(issue.clean());
    else return res.status(404).end();
  });
}

/**
 * PUT /magazineissues/{id}
 *
 * Updates a magazine issue in the database based on the provided ID and form
 * data.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that sets the response status and body.
 * @throws If an error occurs while updating the magazine issue.
 */
export function updateMagazineIssueById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res, requestBody: body } = context;

  return MagazineIssues.updateMagazineIssueById(
    id,
    body as MagazineIssueUpdateData
  ).then((issue) => {
    if (issue) return res.status(200).pureJson(issue.clean());
    else return res.status(404).end();
  });
}

/**
 * DELETE /magazineissues/{id}
 *
 * Deletes a magazine issue from the database based on the provided ID.
 *
 * @param context - The ExegesisContext object containing the request context.
 * @returns A promise that resolves to void.
 */
export function deleteMagazineIssueById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return MagazineIssues.deleteMagazineIssueById(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
