/*
  Database set-up/tear-down for MagazineIssues table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("MagazineIssues", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    issue: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    magazineId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Magazines",
        key: "id",
      },
      onDelete: "CASCADE",
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });

  await queryInterface.addIndex("MagazineIssues", {
    name: "unique_magazine_issue",
    fields: ["magazineId", "issue"],
    unique: true,
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeIndex("MagazineIssues", "unique_magazine_issue");
  await queryInterface.dropTable("MagazineIssues");
}

export { up, down };
