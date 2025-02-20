/**
 * Type declaration for creating a new magazine issue.
 */

import { MagazineNewData } from "../magazines";

export type MagazineIssueNewData = {
  issue: string;
  magazineId?: number;
  magazine?: MagazineNewData;
};
