/**
 * Type declaration for magazine data for creation.
 */

export type MagazineNewData = {
  id?: number;
  name: string;
  language?: string | null;
  aliases?: string | null;
  notes?: string | null;
};
