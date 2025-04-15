/*
  This is the master file for the `models` directory.

  It loads all model classes and uses the `connection` object from the
  `database` directory to initialize the models. It then exports all of them
  as though it were a typical "barrel file".
 */

import { connection } from "../database";

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
import User from "./user";

connection.addModels([
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
  User,
]);

export {
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
  User,
};
