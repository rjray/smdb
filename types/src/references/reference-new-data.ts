/**
 * Type definition for the new data to be added to create a reference.
 */

import { AuthorNewData } from "../authors";
import { BookNewData } from "../books";
import { MagazineFeatureNewData } from "../magazine-features";
import { PhotoCollectionNewData } from "../photo-collections";
import { TagNewData } from "../tags";

export type ReferenceNewData = {
  name: string;
  language?: string | null;
  referenceTypeId: number;
  authors?: Array<AuthorNewData>;
  tags: Array<TagNewData>;
  book?: BookNewData;
  magazineFeature?: MagazineFeatureNewData;
  photoCollection?: PhotoCollectionNewData;
};
