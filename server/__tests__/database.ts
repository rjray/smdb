/**
 * Utility code for tests that need to set up/tear down the database.
 */

import fs from "fs";

import setupDatabase from "database/setup";

/*
  The basic need, here, is this: If the test file is an actual file rather than
  an in-memory database, then it has to be handled differently than if it is
  in-memory. If it is a file, then it has to be deleted before the test and
  (usually) deleted after the test. But, because the tests run in parallel a
  single file name causes race conditions between some test suites.

  Currently, there isn't a way around this based on the structure of
  initializing a database within Sequelize. So, for now just warn the user if
  they are using a file.
 */

function getDatabaseFile(): string {
  const base = process.env.DATABASE_FILE || ":memory:";

  if (base !== ":memory:")
    console.warn(
      "Using a file-based database for testing. This may cause race conditions."
    );

  return base;
}

export async function setupTestDatabase(): Promise<void> {
  const file = getDatabaseFile();

  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }

  process.env.DATABASE_FILE = file;
  await setupDatabase("src");
}

export async function tearDownTestDatabase(): Promise<void> {
  const file = process.env.DATABASE_FILE;
  const preserve = Boolean(process.env.DATABASE_PRESERVE);

  if (!preserve) {
    if (file && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}
