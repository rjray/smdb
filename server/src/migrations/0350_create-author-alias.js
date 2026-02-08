/*
  Database set-up/tear-down for AuthorAliases table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("AuthorAliases", {
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
    authorId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Authors",
        key: "id",
      },
      onDelete: "CASCADE",
      allowNull: false,
    },
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable("AuthorAliases");
}

export { up, down };
