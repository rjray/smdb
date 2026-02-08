/*
  Database set-up/tear-down for AuthorsReferences table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("AuthorsReferences", {
    authorId: {
      primaryKey: true,
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Authors",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    referenceId: {
      primaryKey: true,
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "References",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  });
  await queryInterface.addIndex("AuthorsReferences", {
    fields: ["authorId"],
    name: "authors_references_author",
  });
  await queryInterface.addIndex("AuthorsReferences", {
    fields: ["referenceId"],
    name: "authors_references_reference",
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(
    "AuthorsReferences",
    "authors_references_author"
  );
  await queryInterface.removeIndex(
    "AuthorsReferences",
    "authors_references_reference"
  );
  await queryInterface.dropTable("AuthorsReferences");
}

export { up, down };
