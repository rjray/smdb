/*
  Exegesis controller for all operations under /api/references.
 */

import { ExegesisContext } from "exegesis-express";

import { References } from "db";
import { Reference } from "models";

/*
  GET /references

  Return all reference types. Return value is a list of `Reference` objects.
 */
export function getAllReferences(context: ExegesisContext) {
  const { res } = context;

  return References.fetchAllReferences().then((results: Reference[]) =>
    res.status(200).pureJson(results.map((rt) => rt.clean()))
  );
}

/*
  GET /references/{id}

  Return a single reference type based on the value of `id`. Return value is a
  Promise of a single `ReferenceRecord` object or `null`.
 */
export function getReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return References.fetchOneReference(id).then((referenceType) => {
    if (referenceType) return res.status(200).pureJson(referenceType.clean());
    else return res.status(404).end();
  });
}

/*
  DELETE /references/{id}

  Delete a single reference based on the value of `id`.
 */
export function deleteReferenceById(context: ExegesisContext) {
  const { id } = context.params.path;
  const { res } = context;

  return References.deleteReference(id).then((count: number) => {
    if (count) return res.status(200).end();
    else return res.status(404).end();
  });
}
