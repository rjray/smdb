/**
 * Type declaration for basic magazine issue data used when referring to an
 * issue from another entity.
 */

export type MagazineIssueForReference = {
  id: number;
  issue: string;
  magazineId: number;
  createdAt: string;
  updatedAt: string;
};
