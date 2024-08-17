/*
  Types related to the Tag model and code.
 */

export type TagFetchOpts = {
  references?: boolean;
  referenceCount?: boolean;
};

export type TagRecord = {
  id: number;
  name: string;
  type?: string;
  description?: string;
  referenceCount?: number;
  // TODO: Replace this when references are typed
  references?: Array<unknown>;
};
