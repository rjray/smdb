/**
 * Type declaration for magazine data for update operations.
 */

export type MagazineUpdateData = {
  name?: string;
  language?: string | null;
  aliases?: string | null;
  notes?: string | null;
};
