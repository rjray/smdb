/**
 * Types needed for the Reference model beyond the model declaration itself.
 */

import { AuthorForReference } from "./author";
import { TagForReference } from "./tag";
import { BookForReference } from "./book";
import {
  MagazineFeatureForNewReference,
  MagazineFeatureForUpdateReference,
} from "./magazinefeature";
import {
  PhotoCollectionForNewReference,
  PhotoCollectionForUpdateReference,
} from "./photocollection";

export type ReferenceNewData = {
  name: string;
  language?: string;
  referenceTypeId: number;
  authors?: Array<AuthorForReference>;
  tags: Array<TagForReference>;
  book?: BookForReference;
  magazineFeature?: MagazineFeatureForNewReference;
  photoCollection?: PhotoCollectionForNewReference;
};

export type ReferenceUpdateData = {
  name?: string;
  language?: string;
  referenceTypeId?: number;
  authors?: Array<AuthorForReference>;
  tags?: Array<TagForReference>;
  book?: BookForReference;
  magazineFeature?: MagazineFeatureForUpdateReference;
  photoCollection?: PhotoCollectionForUpdateReference;
};
