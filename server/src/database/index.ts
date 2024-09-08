/*
  This is the master file for the `database` directory.

  This just creates the connection object and exports it along with the
  `Sequelize` class itself. For now, I want to separate the DB connection
  creation from the model modules.
 */

import { Sequelize } from "sequelize-typescript";

const DATABASE_FILE = process.env.DATABASE_FILE || "smdb.db";

const connection = new Sequelize({
  dialect: "sqlite",
  storage: DATABASE_FILE,
  logging: false,
});

export { Sequelize, connection };
