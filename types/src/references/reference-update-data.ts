/**
 * Type definition for the data to be passed for updating a reference.
 */

import { AuthorNewData } from "../authors";
import { BookUpdateData } from "../books";
import { MagazineFeatureUpdateData } from "../magazine-features";
import { PhotoCollectionUpdateData } from "../photo-collections";
import { TagNewData } from "../tags";

export type ReferenceUpdateData = {
  name?: string;
  language?: string | null;
  referenceTypeId?: number;
  authors?: Array<AuthorNewData>;
  tags?: Array<TagNewData>;
  book?: BookUpdateData;
  magazineFeature?: MagazineFeatureUpdateData;
  photoCollection?: PhotoCollectionUpdateData;
};
