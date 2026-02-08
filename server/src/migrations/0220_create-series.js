/*
  Database set-up/tear-down for Series table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("Series", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    notes: {
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
  });

  await queryInterface.addIndex("Series", {
    name: "unique_name_publisher",
    fields: ["name", Sequelize.fn("ifnull", Sequelize.col("publisherId"), 0)],
    unique: true,
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeIndex("Series", "unique_name_publisher");
  await queryInterface.dropTable("Series");
}

export { up, down };
