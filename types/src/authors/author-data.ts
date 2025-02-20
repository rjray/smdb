/**
 * Type declaration for basic author data.
 */

import { AuthorAliasData } from "../author-aliases";
import { ReferenceData } from "../references";

export type AuthorData = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  aliases?: Array<AuthorAliasData> | null;
  referenceCount?: number | null;
  references?: Array<ReferenceData> | null;
};
