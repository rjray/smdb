/**
 * Types needed for the MagazineIssue model beyond the model declaration.
 */

export type MagazineIssueForNewReference = {
  issue: string;
  magazineId?: number;
};

export type MagazineIssueForUpdateReference = {
  issue?: string;
  magazineId?: number;
};
