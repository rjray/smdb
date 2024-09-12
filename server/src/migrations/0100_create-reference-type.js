/*
  Database set-up/tear-down for ReferenceTypes table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("ReferenceTypes", {
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
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    notes: {
      type: Sequelize.STRING,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("ReferenceTypes");
}

export { up, down };
