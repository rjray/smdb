/*
  Database set-up/tear-down for TagsReferences table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("TagsReferences", {
    tagId: {
      primaryKey: true,
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Tags",
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
  await queryInterface.addIndex("TagsReferences", {
    fields: ["tagId"],
    name: "tags_references_tag",
  });
  await queryInterface.addIndex("TagsReferences", {
    fields: ["referenceId"],
    name: "tags_references_reference",
  });
}

async function down(queryInterface) {
  await queryInterface.removeIndex("TagsReferences", "tags_references_tag");
  await queryInterface.removeIndex(
    "TagsReferences",
    "tags_references_reference"
  );
  await queryInterface.dropTable("TagsReferences");
}

export { up, down };
