/*
  Database set-up/tear-down for Tags table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("Tags", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("Tags");
}

export { up, down };
