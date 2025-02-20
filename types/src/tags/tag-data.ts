/**
 * Type declaration for basic tag data.
 */

import { ReferenceData } from "../references";

export type TagData = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  referenceCount?: number;
  references?: Array<ReferenceData>;
};
