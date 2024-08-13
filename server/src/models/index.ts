/*
  This is the master file for the models directory.

  It loads all model classes and creates a `Sequelize` instance around all
  classes. It exports this instance object, but the real purpose is to load
  all the models and initialize them.
 */

import { Sequelize } from "sequelize-typescript";

import Author from "./author";
import AuthorAlias from "./authoralias";
import AuthorsReferences from "./authorsreferences";
import Book from "./book";
import FeatureTag from "./featuretag";
import FeatureTagsMagazineFeatures from "./featuretagsmagazinefeatures";
import Magazine from "./magazine";
import MagazineFeature from "./magazinefeature";
import MagazineIssue from "./magazineissue";
import PhotoCollection from "./photocollection";
import Publisher from "./publisher";
import Reference from "./reference";
import ReferenceType from "./referencetype";
import Series from "./series";
import Tag from "./tag";
import TagsReferences from "./tagsreferences";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "smdb.db",
  logging: false,
  models: [
    Author,
    AuthorAlias,
    AuthorsReferences,
    Book,
    FeatureTag,
    FeatureTagsMagazineFeatures,
    Magazine,
    MagazineFeature,
    MagazineIssue,
    PhotoCollection,
    Publisher,
    ReferenceType,
    Reference,
    Series,
    Tag,
    TagsReferences,
  ],
});
