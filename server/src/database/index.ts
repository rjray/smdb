/*
  This is the master file for the `database` directory.

  This just creates the connection object and exports it along with the
  `Sequelize` class itself. For now, I want to separate the DB connection
  creation from the model modules.
 */

import { Sequelize } from "sequelize-typescript";

const connection = new Sequelize({
  dialect: "sqlite",
  storage: "smdb.db",
  logging: false,
});

export { Sequelize, connection };
