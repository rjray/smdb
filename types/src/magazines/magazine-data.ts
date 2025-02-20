/**
 * Type declaration for magazine data.
 */

import { MagazineIssueForReference } from "../magazine-issues";

export type MagazineData = {
  id: number;
  name: string;
  language: string | null;
  aliases: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  issueCount?: number;
  issues?: Array<MagazineIssueForReference>;
};
