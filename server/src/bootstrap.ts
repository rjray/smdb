/**
 * Bootstrap a database file for the application. Used for testing and for
 * creating the database for population by the importer script.
 */

// This is all that is needed or used. The connection to the SQLite database is
// handled by the `database/index.ts` module, and uses the environment variable
// `DATABASE_FILE` to specify the location of the database.
import setupDatabase from "database/setup";

(async () => {
  await setupDatabase(import.meta.dirname);
})();
