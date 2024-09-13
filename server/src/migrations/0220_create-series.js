/*
  Database set-up/tear-down for Series table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("Series", {
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
    publisherId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Publishers",
        key: "id",
      },
      onDelete: "SET NULL",
      allowNull: true,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("Series");
}

export { up, down };
