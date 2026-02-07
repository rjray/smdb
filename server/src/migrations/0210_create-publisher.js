/*
  Database set-up/tear-down for Publishers table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Publishers", {
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
    notes: {
      type: Sequelize.STRING,
    },
  });
}

async function down(queryInterface) {
  await queryInterface.dropTable("Publishers");
}

export { up, down };
