/*
  Database set-up/tear-down for FeatureTags table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("FeatureTags", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: Sequelize.STRING,
    },
  });
}

async function down(queryInterface) {
  await queryInterface.dropTable("FeatureTags");
}

export { up, down };
