/**
 * Type declaration for magazine data for reference by other entities.
 */

export type MagazineForReference = {
  id: number;
  name: string;
  language: string | null;
  aliases: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
