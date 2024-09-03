/*
  Database operations focused on the Reference model.
 */

import { BaseError } from "sequelize";

import {
  Reference,
  Author,
  Tag,
  FeatureTag,
  Book,
  Publisher,
  Series,
  PhotoCollection,
  MagazineFeature,
  Magazine,
  MagazineIssue,
} from "models";
import { ReferenceUpdateData, ReferenceNewData } from "types/reference";
import { AuthorForReference } from "types/author";
import { TagForReference } from "types/tag";
import { BookForReference } from "types/book";
import { FeatureTagForReference } from "types/featuretag";
import { MagazineFeatureForNewReference } from "types/magazinefeature";
import { RequestOpts, getScopeFromParams } from "utils";

// The scopes that can be fetched for references.
const referenceScopes = ["authors", "tags"];

/*
  These functions are to support the `addReference` and `updateReference`
  functions.
 */

// Fix up the list of authors for the reference.
async function fixupAuthors(authors: Array<AuthorForReference> | undefined) {
  if (!authors || authors.length === 0) {
    return []; // Nothing to do
  }

  // Create new authors if they don't exist
  const fixedAuthors: Array<AuthorForReference> = [];
  fixedAuthors.length = authors.length;
  authors.forEach(async (author, index) => {
    // If the author is already in the database, don't need to create.
    if (author.id) {
      fixedAuthors[index] = author;
    } else if (author.name) {
      const newAuthor = await Author.create({ name: author.name });
      fixedAuthors[index] = { id: newAuthor.id, name: newAuthor.name };
    }
  });

  return fixedAuthors;
}

// Fix up the list of tags for the reference.
async function fixupTags(tags: Array<TagForReference>) {
  // Create new tags if they don't exist
  const fixedTags: Array<TagForReference> = [];
  fixedTags.length = tags.length;
  tags.forEach(async (tag, index) => {
    // If the tag is already in the database, don't need to create.
    if (tag.id) {
      fixedTags[index] = tag;
    } else if (tag.name) {
      const newTag = await Tag.create({ name: tag.name });
      fixedTags[index] = { id: newTag.id, name: newTag.name };
    } else {
      throw new Error("Tag name is required to create a new tag");
    }
  });

  return fixedTags;
}

// Fix up book data for a reference. This may mean creating new publishers and
// series.
async function fixupBook(book: BookForReference): Promise<BookForReference> {
  // Create new publisher if it doesn't exist
  if (book.publisher && !book.publisher.id && book.publisher.name) {
    const { name, notes } = book.publisher;
    const newPublisher = await Publisher.create({ name, notes });
    book.publisherId = newPublisher.id;
    delete book.publisher;
  }

  // Create new series if it doesn't exist
  if (book.series && !book.series.id && book.series.name) {
    const { name, notes } = book.series;
    const publisherId = book.publisherId;
    const newSeries = await Series.create({ name, notes, publisherId });
    book.seriesId = newSeries.id;
    delete book.series;
  }

  return book;
}

// Add a book reference to the database. This requires checking of the authors,
// tags, and book data. Each of those fixup* functions will create new records
// if necessary.
async function addBookReference(data: ReferenceNewData) {
  // These three require "fixup" functions to ensure that the data is correct,
  // and to create new records if necessary.
  const authors = await fixupAuthors(data.authors);
  const tags = await fixupTags(data.tags);
  // Note that we've already checked that the book data exists prior to this
  // function being called.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const book = await fixupBook(data.book!);

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  return Reference.create(
    {
      name,
      language,
      referenceTypeId,
      authors,
      tags,
      book,
    },
    {
      include: [Author, Tag, Book],
    }
  );
}

// Fix up the list of feature tags for a magazine feature.
async function fixupFeatureTags(featureTags: Array<FeatureTagForReference>) {
  // Create new feature feature tags if they don't exist
  const fixedFeatureTags: Array<FeatureTagForReference> = [];
  fixedFeatureTags.length = featureTags.length;
  featureTags.forEach(async (featureTag, index) => {
    // If the featureTag is already in the database, don't need to create.
    if (featureTag.id) {
      fixedFeatureTags[index] = featureTag;
    } else if (featureTag.name) {
      const newTag = await FeatureTag.create({ name: featureTag.name });
      fixedFeatureTags[index] = { id: newTag.id, name: newTag.name };
    } else {
      throw new Error("Tag name is required to create a new feature tag");
    }
  });

  return fixedFeatureTags;
}

// Fix up magazine feature data for a reference. This may mean creating new
// magazine issue or magazine records. This function will create new records if
// necessary. Also checks and fixes up the feature tags.
async function fixupMagazineFeature(
  magazineFeature: MagazineFeatureForNewReference
): Promise<MagazineFeatureForNewReference> {
  // Create new magazine feature if it doesn't exist
  if (magazineFeature.magazine && magazineFeature.magazine.name) {
    const { name, language, aliases, notes } = magazineFeature.magazine;
    const newMagazine = await Magazine.create({
      name,
      language,
      aliases,
      notes,
    });
    magazineFeature.magazineId = newMagazine.id;
    delete magazineFeature.magazine;
  }

  // Create new magazine issue if it doesn't exist
  if (magazineFeature.magazineIssue && !magazineFeature.magazineIssue.issue) {
    const { issue } = magazineFeature.magazineIssue;
    const magazineId = magazineFeature.magazineId;
    const newMagazineIssue = await MagazineIssue.create({
      issue,
      magazineId,
    });
    magazineFeature.magazineIssueId = newMagazineIssue.id;
    delete magazineFeature.magazineIssue;
  }

  // Create any feature tags that don't exist
  const featureTags = await fixupFeatureTags(magazineFeature.featureTags);
  magazineFeature.featureTags = featureTags;

  return magazineFeature;
}

// Add a magazine feature reference to the database. This requires checking of
// the two basic fields, as at least one is needed. It also requires checking of
// the authors, tags, and feature tags.
async function addMagazineFeatureReference(data: ReferenceNewData) {
  // These two require "fixup" functions to ensure that the data is correct,
  // and to create new records if necessary.
  const authors = await fixupAuthors(data.authors);
  const tags = await fixupTags(data.tags);
  // Note that we've already checked that the magazine feature data exists
  // prior to this function being called.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const magazineFeature = await fixupMagazineFeature(data.magazineFeature!);

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  return Reference.create(
    {
      name,
      language,
      referenceTypeId,
      authors,
      tags,
      magazineFeature,
    },
    {
      include: [Author, Tag, MagazineFeature],
    }
  );
}

// Add a photo collection reference to the database. This requires checking of
// the two fields, as they are required for a photo collection reference to be
// created. It also requires checking of the authors and tags.
async function addPhotoCollectionReference(data: ReferenceNewData) {
  // These two require "fixup" functions to ensure that the data is correct,
  // and to create new records if necessary.
  const authors = await fixupAuthors(data.authors);
  const tags = await fixupTags(data.tags);
  // Note that we've already checked that the photo collection data exists prior
  // to this function being called.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const photoCollection = data.photoCollection!;

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  return Reference.create(
    {
      name,
      language,
      referenceTypeId,
      authors,
      tags,
      photoCollection,
    },
    {
      include: [Author, Tag, PhotoCollection],
    }
  );
}

/**
 * Add a reference to the database. This requires a lot of checking of the data
 * before it is added to the database. It is necessary to determine which of
 * the three sub-types of reference is being created, as well as check for
 * authors and tags. Additionally, if a book reference is being created, it is
 * necessary to check for publishers and series. If a magazine feature reference
 * is being created, it is necessary to check for feature tags, magazine issue
 * and possibly magazine. Photo collection references are the simplest, as they
 * have no nested data.
 *
 * @param data - The reference data to be added.
 * @returns A promise that resolves to the created reference.
 */
export function addReference(data: ReferenceNewData): Promise<Reference> {
  if (!data.referenceTypeId) {
    throw new Error("Reference type ID is required");
  }
  if (!data.name) {
    throw new Error("Reference name is required");
  }
  if (!data.tags || data.tags.length === 0) {
    throw new Error("Reference must have at least one tag");
  }

  switch (data.referenceTypeId) {
    case 1:
      if (!data.book) {
        throw new Error("Reference must have book data");
      }
      return addBookReference(data);
    case 2:
      if (!data.magazineFeature) {
        throw new Error("Reference must have magazine feature data");
      }
      return addMagazineFeatureReference(data);
    case 3:
      if (!data.photoCollection) {
        throw new Error("Reference must have photo collection data");
      }
      return addPhotoCollectionReference(data);
    default:
      throw new Error("Invalid reference type ID");
  }
}

/**
 * Fetches all references with additional data based on the provided options.
 *
 * @param opts - The options for fetching references' additional data.
 * @returns A promise that resolves to an array of references.
 * @throws If there is an error while fetching the references.
 */
export function fetchAllReferences(opts: RequestOpts): Promise<Reference[]> {
  const scope = getScopeFromParams(opts, referenceScopes);

  return Reference.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Fetches a single reference by ID with additional data based on the provided
 * options.
 *
 * @param id - The ID of the reference to fetch.
 * @param opts - The options for fetching the reference's additional data.
 * @returns A promise that resolves to the fetched reference or null if not
 * found.
 * @throws If there is an error while fetching the reference.
 */
export function fetchOneReference(
  id: number,
  opts: RequestOpts
): Promise<Reference | null> {
  const scope = getScopeFromParams(opts, referenceScopes);

  return Reference.scope(scope)
    .findByPk(id)
    .then((reference) => reference)
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Updates a reference in the database. Assumes that the content is valid.
 * Throws an error if the reference is not found.
 *
 * @param id - The ID of the reference to update.
 * @param data - The data to update the reference with.
 * @returns A promise that resolves to the updated reference.
 */
export function updateReference(
  id: number,
  data: ReferenceUpdateData
): Promise<Reference> {
  return Reference.findByPk(id)
    .then((reference) => {
      if (!reference) {
        throw new Error("Reference not found");
      }

      return reference.update(data);
    })
    .catch((error: BaseError) => {
      throw new Error(error.message);
    });
}

/**
 * Deletes a reference from the database based on the provided ID.
 *
 * @param id - The ID of the reference to delete.
 * @returns A promise that resolves to the number of deleted references.
 */
export function deleteReference(id: number) {
  return Reference.destroy({ where: { id } });
}
