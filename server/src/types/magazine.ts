/**
 * Types needed for the MagazineIssue model beyond the model declaration.
 */

export type MagazineForNewReference = {
  name: string;
  language?: string;
  aliases?: string;
  notes?: string;
};

export type MagazineForUpdateReference = {
  name?: string;
  language?: string;
  aliases?: string;
  notes?: string;
};
