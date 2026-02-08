/*
  Database set-up/tear-down for PhotoCollections table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("PhotoCollections", {
    referenceId: {
      allowNull: false,
      primaryKey: true,
      unique: true,
      references: {
        model: "References",
        key: "id",
      },
      onDelete: "CASCADE",
      type: Sequelize.INTEGER,
    },
    location: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    media: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("PhotoCollections");
}

export { up, down };
