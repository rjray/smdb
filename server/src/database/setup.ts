/*
  This module provides the setup functionality for the database. This will be a
  single exported function that will initialize a database using the existing
  connection object. Initialization consists of:

  1. Running the schema via `sequelize.query()`. The schema is defined in the
     `schema` directory, in the file `schema.sql`.
  2. Add the seed data for the database. The seed data is defined in a series
     of CSV files in the `schema` directory.
  3. Do minor sanity-checking of the seeded data.
 */

import fs from "fs";
import { parse } from "csv-parse";
import sqlite3 from "sqlite3";

import { ReferenceType, Tag, FeatureTag } from "models";

// Helper function to process CSV files.
async function processCsvFile(file: string, columns: string[]) {
  const records = [];
  const parser = fs.createReadStream(file).pipe(
    parse({
      columns,
      cast: (value, context) =>
        context.column === "id" ? Number(value) : value,
    })
  );

  for await (const record of parser) {
    records.push(record);
  }

  return records;
}

// Seed the reference types into the database.
async function seedReferenceTypes(directory: string): Promise<void> {
  const referenceTypes = await processCsvFile(
    `${directory}/reference_types.csv`,
    ["id", "name", "description", "notes"]
  );
  await ReferenceType.bulkCreate(referenceTypes);
  const rows = await ReferenceType.findAll();

  if (rows.length !== referenceTypes.length) {
    throw new Error("Failed to seed reference types");
  }
}

// Seed the tags into the database.
async function seedTags(directory: string): Promise<void> {
  const tags = await processCsvFile(`${directory}/tags.csv`, [
    "id",
    "name",
    "type",
    "description",
  ]);
  await Tag.bulkCreate(tags);
  const rows = await Tag.findAll();

  if (rows.length !== tags.length) {
    throw new Error("Failed to seed tags");
  }
}

// Seed the feature tags into the database.
async function seedFeatureTags(directory: string): Promise<void> {
  const featureTags = await processCsvFile(`${directory}/feature_tags.csv`, [
    "id",
    "name",
    "description",
  ]);
  await FeatureTag.bulkCreate(featureTags);
  const rows = await FeatureTag.findAll();

  if (rows.length !== featureTags.length) {
    throw new Error("Failed to seed feature tags");
  }
}

// Initialize the database. This will run the schema and add the seed data. It
// uses the `connection` object to run a raw query that creates the schema, then
// calls the three seed functions.
export default async function setupDatabase(file: string, directory: string) {
  try {
    // Install the schema
    const schema = fs.readFileSync(`${directory}/schema.sql`, "utf-8");
    const conn = new sqlite3.Database(file);
    await conn.exec(schema);
    conn.close();

    // Add the seed data
    await seedReferenceTypes(directory);
    await seedTags(directory);
    await seedFeatureTags(directory);
  } catch (err) {
    // Something went wrong with the schema or the CSV files.
    throw new Error(`Failed to initialize the database: ${err}`);
  }
}
