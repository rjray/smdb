/*
  Database set-up/tear-down for Publishers table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("Publishers", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    notes: {
      type: Sequelize.STRING,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("Publishers");
}

export { up, down };
