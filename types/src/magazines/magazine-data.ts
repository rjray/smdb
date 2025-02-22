/**
 * Type declaration for magazine data.
 */

import { MagazineIssueForReference } from "../magazine-issues";

/**
 * JSON representation of a magazine record.
 *
 * @property {number} id - The unique identifier of the magazine.
 * @property {string} name - The name of the magazine.
 * @property {string|null} language - The language of the magazine (optional).
 * @property {string|null} aliases - The aliases of the magazine (optional).
 * @property {string|null} notes - Additional notes about the magazine
 * (optional).
 * @property {string} createdAt - The timestamp when the magazine record was
 * created.
 * @property {string} updatedAt - The timestamp when the magazine record was
 * last updated.
 * @property {number} [issueCount] - The number of issues of the magazine
 * @property {Array<MagazineIssueRecord>} [issues] - An array of magazine issue
 * records (optional).
 */
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
