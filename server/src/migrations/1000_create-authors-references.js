/*
  Database set-up/tear-down for AuthorsReferences table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("AuthorsReferences", {
    authorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Authors",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    referenceId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "References",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  });
  await queryInterface.addConstraint("AuthorsReferences", {
    fields: ["authorId", "referenceId"],
    name: "authors_references_pk",
    type: "primary key",
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
  await queryInterface.removeConstraint(
    "AuthorsReferences",
    "authors_references_pk"
  );
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
