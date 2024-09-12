/*
  Database set-up/tear-down for FeatureTagsMagazineFeatures table.
 */

import { Sequelize } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.createTable("FeatureTagsMagazineFeatures", {
    featureTagId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "FeatureTags",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    magazineFeatureId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "MagazineFeatures",
        key: "referenceId",
      },
      onDelete: "CASCADE",
    },
  });
  await queryInterface.addConstraint("FeatureTagsMagazineFeatures", {
    fields: ["featureTagId", "magazineFeatureId"],
    name: "featuretags_magazinefeatures_pk",
    type: "primary key",
  });
  await queryInterface.addIndex("FeatureTagsMagazineFeatures", {
    fields: ["featureTagId"],
    name: "featuretags_magazinefeatures_featuretag",
  });
  await queryInterface.addIndex("FeatureTagsMagazineFeatures", {
    fields: ["magazineFeatureId"],
    name: "featuretags_magazinefeatures_magazinefeature",
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint(
    "FeatureTagsMagazineFeatures",
    "featuretags_magazinefeatures_pk"
  );
  await queryInterface.removeIndex(
    "FeatureTagsMagazineFeatures",
    "featuretags_magazinefeatures_featuretag"
  );
  await queryInterface.removeIndex(
    "FeatureTagsMagazineFeatures",
    "featuretags_magazinefeatures_magazinefeature"
  );
  await queryInterface.dropTable("FeatureTagsMagazineFeatures");
}

export { up, down };
