/*
  Database set-up/tear-down for Books table.
 */

async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Books", {
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
    isbn: {
      type: Sequelize.STRING,
    },
    seriesNumber: {
      type: Sequelize.STRING,
    },
    publisherId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Publishers",
        key: "id",
      },
      onDelete: "SET NULL",
      allowNull: true,
    },
    seriesId: {
      type: Sequelize.INTEGER,
      references: {
        model: "Series",
        key: "id",
      },
      onDelete: "SET NULL",
      allowNull: true,
    },
  });
}

async function down(queryInterface) {
  await queryInterface.dropTable("Books");
}

export { up, down };
