/*
  Database set-up/tear-down for Tags table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Tags", {
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
    type: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
  });
}

async function down(queryInterface) {
  await queryInterface.dropTable("Tags");
}

export { up, down };
