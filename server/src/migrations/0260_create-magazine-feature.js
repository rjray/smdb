/*
  Database set-up/tear-down for MagazineFeatures table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("MagazineFeatures", {
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

async function down(queryInterface) {
  await queryInterface.dropTable("MagazineFeatures");
}

export { up, down };
