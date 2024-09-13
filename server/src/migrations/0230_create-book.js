/*
  Database set-up/tear-down for Books table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("Books", {
    referenceId: {
      allowNull: false,
      primaryKey: true,
      references: {
        model: "References",
        key: "id",
      },
      onDelete: "CASCADE",
      type: Sequelize.INTEGER,
    },
    isbn: {
      type: Sequelize.STRING,
    },
    seriesNumber: {
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
    seriesId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Series",
        key: "id",
      },
      onDelete: "SET NULL",
      allowNull: true,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("Books");
}

export { up, down };
