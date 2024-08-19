/*
  Entry-point file for the `db` directory. Re-exports the various model-based
  code under plural forms of the names.
 */

import * as Authors from "./authors";
import * as FeatureTags from "./featuretags";
import * as Publishers from "./publishers";
import * as ReferenceTypes from "./referencetypes";
import * as Series from "./series";
import * as Tags from "./tags";
import * as Users from "./users";

export {
  Authors,
  FeatureTags,
  Publishers,
  ReferenceTypes,
  Series,
  Tags,
  Users,
};
