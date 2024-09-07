/**
 * Types needed for the PhotoCollection model beyond the model declaration
 * itself.
 */

export type PhotoCollectionForNewReference = {
  location: string;
  media: string;
};

export type PhotoCollectionForUpdateReference = {
  location?: string;
  media?: string;
};
