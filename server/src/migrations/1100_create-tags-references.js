/*
  Database set-up/tear-down for TagsReferences table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("TagsReferences", {
    tagId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Tags",
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
  await queryInterface.addConstraint("TagsReferences", {
    fields: ["tagId", "referenceId"],
    name: "tags_references_pk",
    type: "primary key",
  });
  await queryInterface.addIndex("TagsReferences", {
    fields: ["tagId"],
    name: "tags_references_tag",
  });
  await queryInterface.addIndex("TagsReferences", {
    fields: ["referenceId"],
    name: "tags_references_reference",
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint("TagsReferences", "tags_references_pk");
  await queryInterface.removeIndex("TagsReferences", "tags_references_tag");
  await queryInterface.removeIndex(
    "TagsReferences",
    "tags_references_reference"
  );
  await queryInterface.dropTable("TagsReferences");
}

export { up, down };
