/*
  Database set-up/tear-down for Magazines table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Magazines", {
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
    language: {
      type: Sequelize.STRING,
    },
    aliases: {
      type: Sequelize.STRING,
    },
    notes: {
      type: Sequelize.STRING,
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
  await queryInterface.dropTable("Magazines");
}

export { up, down };
