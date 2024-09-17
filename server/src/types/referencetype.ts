/**
 * Types needed for the ReferenceType model beyond the model declaration itself.
 */

export type ReferenceTypeNewData = {
  name: string;
  description: string;
  notes?: string | null;
};

export type ReferenceTypeUpdateData = {
  name?: string;
  description?: string;
  notes?: string | null;
};
