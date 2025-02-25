/**
 * Type declaration for updating a magazine issue.
 */

import { MagazineNewData } from "../magazines";

export type MagazineIssueUpdateData = {
  issue?: string;
  magazineId?: number;
  magazine?: MagazineNewData;
};
