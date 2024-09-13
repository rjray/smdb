/*
  Database set-up/tear-down for MagazineFeatures table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("MagazineFeatures", {
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
    magazineIssueId: {
      allowNull: false,
      primaryKey: true,
      references: {
        model: "MagazineIssues",
        key: "id",
      },
      onDelete: "CASCADE",
      type: Sequelize.INTEGER,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("MagazineFeatures");
}

export { up, down };
