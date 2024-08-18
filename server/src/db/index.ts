/*
  Entry-point file for the `db` directory. Re-exports the various model-based
  code under plural forms of the names.
 */

import * as Authors from "./authors";
import * as Tags from "./tags";

export { Authors, Tags };
