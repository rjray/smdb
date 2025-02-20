/**
 * Type declaration for reference data.
 */

import { AuthorForReference } from "../authors";
import { BookData } from "../books";
import { MagazineFeatureForReference } from "../magazine-features";
import { PhotoCollectionData } from "../photo-collections";
import { TagForReference } from "../tags";

export type ReferenceData = {
  id: number;
  name: string;
  language: string | null;
  referenceTypeId: number;
  createdAt: string;
  updatedAt: string;
  authors?: Array<AuthorForReference>;
  tags?: Array<TagForReference>;
  book?: BookData;
  MagazineFeature?: MagazineFeatureForReference;
  photoCollection?: PhotoCollectionData;
};
