/**
 * Type declaration for reference type data.
 */

import { ReferenceData } from "../references";

export type ReferenceTypeData = {
  name: string;
  description: string;
  notes: string | null;
  references?: Array<ReferenceData>;
};
