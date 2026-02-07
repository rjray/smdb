/*
  Database set-up/tear-down for Authors table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Authors", {
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
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
}

async function down(queryInterface) {
  await queryInterface.dropTable("Authors");
}

export { up, down };
