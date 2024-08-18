/*
  Types related to the Tag model and code.
 */

export type FeatureTagFetchOpts = {
  references?: boolean;
  referenceCount?: boolean;
};

export type FeatureTagRecord = {
  id: number;
  name: string;
  description?: string;
  referenceCount?: number;
  // TODO: Replace this when references are typed
  references?: Array<unknown>;
};
