/*
  Database operations focused on the Reference model.
 */

import { BaseError, Transaction } from "sequelize";

import { connection } from "database";
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
  AuthorsReferences,
  TagsReferences,
  FeatureTagsMagazineFeatures,
} from "models";
import { ReferenceUpdateData, ReferenceNewData } from "types/reference";
import { AuthorForReference } from "types/author";
import { TagForReference } from "types/tag";
import { BookForReference } from "types/book";
import { FeatureTagForReference } from "types/featuretag";
import {
  MagazineFeatureForNewReference,
  MagazineFeatureForUpdateReference,
} from "types/magazinefeature";
import { PhotoCollectionForUpdateReference } from "types/photocollection";
// Oops... tripped over a deprecated name if I don't use the relative import.
import { ReferenceTypes } from "../constants";
import { RequestOpts, getScopeFromParams } from "utils";

// The scopes that can be fetched for references.
const referenceScopes = ["authors", "tags"];

/*
  These functions are to support the `addReference` and `updateReference`
  functions.
 */

// Fix up the list of authors for a new reference.
async function fixupAuthors(
  authors: Array<AuthorForReference> | undefined,
  transaction: Transaction
) {
  if (!authors || authors.length === 0) {
    return []; // Nothing to do
  }

  // Create new authors if they don't exist. If the record is essentially
  // empty, ignore it.
  const fixedAuthors: Array<AuthorForReference> = [];
  for (const author of authors) {
    // If the author is already in the database, don't need to create.
    if (author.id) {
      fixedAuthors.push(author);
    } else if (author.name) {
      const newAuthor = await Author.create(
        { name: author.name },
        { transaction }
      );
      fixedAuthors.push({ id: newAuthor.id, name: newAuthor.name });
    }
  }

  return fixedAuthors;
}

// Fix up the list of tags for the reference.
async function fixupTags(
  tags: Array<TagForReference>,
  transaction: Transaction
) {
  if (!tags || tags.length === 0) {
    return []; // Nothing to do
  }

  // Create new tags if they don't exist. Since these are handled in the UI a
  // little differently, there shouldn't be any empty records. So an empty
  // record is an error.
  const fixedTags: Array<TagForReference> = [];
  for (const tag of tags) {
    // If the tag is already in the database, don't need to create.
    if (tag.id) {
      fixedTags.push(tag);
    } else if (tag.name) {
      const newTag = await Tag.create({ name: tag.name }, { transaction });
      fixedTags.push({ id: newTag.id, name: newTag.name });
    } else {
      throw new Error("fixupTags: Tag name is required to create a new tag");
    }
  }

  return fixedTags;
}

// Fix up book data for a reference. This may mean creating new publishers and
// series.
async function fixupBook(
  book: BookForReference,
  transaction: Transaction
): Promise<BookForReference> {
  // Create new publisher if it doesn't exist
  if (book.publisher && !book.publisher.id && book.publisher.name) {
    const { name, notes } = book.publisher;
    const newPublisher = await Publisher.create(
      { name, notes },
      { transaction }
    );
    book.publisherId = newPublisher.id;
    delete book.publisher;
  }

  // Create new series if it doesn't exist
  if (book.series && !book.series.id && book.series.name) {
    const { name, notes } = book.series;
    const publisherId = book.publisherId;
    const newSeries = await Series.create(
      { name, notes, publisherId },
      { transaction }
    );
    book.seriesId = newSeries.id;
    delete book.series;
  }

  return book;
}

// Add a book reference to the database. This requires checking of the book
// data then creating the core reference instance. After this is done, the
// "main" creation function will handle the authors and tags.
async function addBookReference(
  data: ReferenceNewData,
  transaction: Transaction
) {
  // Note that we've already checked that the book data exists prior to this
  // function being called.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const book = await fixupBook(data.book!, transaction);

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  return Reference.create(
    {
      name,
      language,
      referenceTypeId,
      book,
    },
    {
      include: [Book],
      transaction,
    }
  );
}

// Fix up the list of feature tags for a magazine feature.
async function fixupFeatureTags(
  featureTags: Array<FeatureTagForReference>,
  transaction: Transaction
) {
  // Create new feature feature tags if they don't exist
  const fixedFeatureTags: Array<FeatureTagForReference> = [];
  fixedFeatureTags.length = featureTags.length;
  featureTags.forEach(async (featureTag, index) => {
    // If the featureTag is already in the database, don't need to create.
    if (featureTag.id) {
      fixedFeatureTags[index] = featureTag;
    } else if (featureTag.name) {
      const newTag = await FeatureTag.create(
        { name: featureTag.name },
        { transaction }
      );
      fixedFeatureTags[index] = { id: newTag.id, name: newTag.name };
    } else {
      throw new Error(
        "fixupFeatureTags: Tag name is required to create a new feature tag"
      );
    }
  });

  return fixedFeatureTags;
}

// Fix up magazine feature data for a new reference. This may mean creating new
// magazine issue or magazine records. This function will create new records if
// necessary. Also checks and fixes up the feature tags.
async function fixupMagazineFeatureForCreate(
  magazineFeature: MagazineFeatureForNewReference,
  transaction: Transaction
): Promise<MagazineFeatureForNewReference> {
  // Create new magazine feature if it doesn't exist
  if (magazineFeature.magazine && magazineFeature.magazine.name) {
    const { name, language, aliases, notes } = magazineFeature.magazine;
    const newMagazine = await Magazine.create(
      {
        name,
        language,
        aliases,
        notes,
      },
      { transaction }
    );
    magazineFeature.magazineId = newMagazine.id;
    delete magazineFeature.magazine;
  }

  // Create new magazine issue if it doesn't exist
  if (magazineFeature.magazineIssue && !magazineFeature.magazineIssue.issue) {
    const { issue } = magazineFeature.magazineIssue;
    const magazineId = magazineFeature.magazineId;
    const newMagazineIssue = await MagazineIssue.create(
      {
        issue,
        magazineId,
      },
      { transaction }
    );
    magazineFeature.magazineIssueId = newMagazineIssue.id;
    delete magazineFeature.magazineIssue;
  }

  // Create any feature tags that don't exist
  const featureTags = await fixupFeatureTags(
    magazineFeature.featureTags,
    transaction
  );
  magazineFeature.featureTags = featureTags;

  return magazineFeature;
}

// Add a magazine feature reference to the database. This requires checking of
// the two basic fields, as at least one is needed. It then creates the core
// reference instance. After this is done, the "main" creation function will
// handle the authors and tags.
async function addMagazineFeatureReference(
  data: ReferenceNewData,
  transaction: Transaction
) {
  // Note that we've already checked that the magazine feature data exists
  // prior to this function being called.
  const magazineFeature = await fixupMagazineFeatureForCreate(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.magazineFeature!,
    transaction
  );

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  return Reference.create(
    {
      name,
      language,
      referenceTypeId,
      magazineFeature,
    },
    {
      include: [MagazineFeature],
      transaction,
    }
  );
}

// Add a photo collection reference to the database. This requires checking of
// the two fields, as they are required for a photo collection reference to be
// created. It then creates the core reference instance. After this is done, the
// "main" creation function will handle the authors and tags.
async function addPhotoCollectionReference(
  data: ReferenceNewData,
  transaction: Transaction
) {
  // Note that we've already checked that the photo collection data exists prior
  // to this function being called.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const photoCollection = data.photoCollection!;

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  const reference = await Reference.create(
    {
      name,
      language,
      referenceTypeId,
      photoCollection,
    },
    {
      include: [PhotoCollection],
      transaction,
    }
  );

  return reference;
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
export async function addReference(data: ReferenceNewData): Promise<Reference> {
  if (!data.referenceTypeId) {
    throw new Error("addReference: Reference type ID is required");
  }
  if (!data.name) {
    throw new Error("addReference: Reference name is required");
  }
  if (!data.tags || data.tags.length === 0) {
    throw new Error("addReference: Reference must have at least one tag");
  }

  try {
    const reference = await connection.transaction(async (transaction) => {
      // These two require "fixup" functions to ensure that the data is correct,
      // and to create new records if necessary.
      const authors = await fixupAuthors(data.authors, transaction);
      const tags = await fixupTags(data.tags, transaction);

      let reference;
      switch (data.referenceTypeId) {
        case ReferenceTypes.Book:
          if (!data.book) {
            throw new Error("addReference: Reference must have book data");
          }
          reference = await addBookReference(data, transaction);
          break;
        case ReferenceTypes.MagazineFeature:
          if (!data.magazineFeature) {
            throw new Error(
              "addReference: Reference must have magazine feature data"
            );
          }
          reference = await addMagazineFeatureReference(data, transaction);
          break;
        case ReferenceTypes.PhotoCollection:
          if (!data.photoCollection) {
            throw new Error(
              "addReference: Reference must have photo collection data"
            );
          }
          reference = await addPhotoCollectionReference(data, transaction);
          break;
        default:
          throw new Error("addReference: Invalid reference type ID");
      }

      // Add the authors and tags
      await reference.addAuthors(authors, { transaction });
      await reference.addTags(tags, { transaction });

      return reference;
    });

    return reference;
  } catch (error) {
    if (error instanceof BaseError) {
      throw new Error(
        `addReference: Error in create transaction: ${error.message}`
      );
    } else {
      throw error;
    }
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
  const scope = getScopeFromParams(opts ?? {}, referenceScopes);

  return Reference.scope(scope)
    .findAll()
    .catch((error: BaseError) => {
      throw new Error(`fetchAllReferences: ${error.message}`);
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
  const scope = getScopeFromParams(opts ?? {}, referenceScopes);

  return Reference.scope(scope)
    .findByPk(id)
    .then((reference) => reference)
    .catch((error: BaseError) => {
      throw new Error(`fetchOneReference: ${error.message}`);
    });
}

// Update the core (common) data of a reference. This covers `name`, `language`
// and both of `authors` and `tags`. The latter two need to be fixed-up in a
// way similar to what was done for `addReference`.
async function updateCoreReferenceData(
  reference: Reference,
  updateData: ReferenceUpdateData,
  transaction: Transaction
) {
  const { name, language, authors, tags } = updateData;
  const data = {} as Partial<Reference>;

  // These two (authors and tags) need to be fixed up in a similar way as they
  // were fixed up in `addReference`. Then for the update to be successful, we
  // need to remove the old relations and add the new ones.
  if (authors) {
    const newAuthors = await fixupAuthors(authors, transaction);
    await AuthorsReferences.destroy({
      where: { referenceId: reference.id },
      transaction,
    });
    await AuthorsReferences.bulkCreate(
      newAuthors.map((author) => ({
        authorId: author.id,
        referenceId: reference.id,
      })),
      { transaction }
    );
  }
  // Note that while tags are required, they aren't necessary for an update.
  // But if the value is provided, we need to fix it up.
  if (tags && tags.length > 0) {
    const newTags = await fixupTags(tags, transaction);
    await TagsReferences.destroy({
      where: { referenceId: reference.id },
      transaction,
    });
    await TagsReferences.bulkCreate(
      newTags.map((tag) => ({
        tagId: tag.id,
        referenceId: reference.id,
      })),
      { transaction }
    );
  }

  // Update the basic data. This also returns the updated reference instance.
  if (name) {
    data.name = name;
  }
  if (language) {
    data.language = language;
  }
  return reference.update(data, { transaction });
}

// Update the data for a book relation in the database. If the reference is
// already a book, then the data validation is much more shallow and the
// existing book relation is updated. If it isn't currently a book, then the
// validation of `book` is more strict and a new book relation is created.
async function updateBookData(
  reference: Reference,
  book: BookForReference,
  transaction: Transaction
): Promise<void> {
  // First we do a fix-up on the book data. This will create any new series or
  // publisher if necessary.
  const newBook = await fixupBook(book, transaction);

  if (reference.referenceTypeId !== 1) {
    // This was not a book reference previously. We don't have to check the
    // data any harder, because all of the fields are optional. But we do have
    // to use Book.create() to create the new book relation.
    await Book.create(
      {
        referenceId: reference.id,
        ...newBook,
      },
      { transaction }
    );
  } else {
    // This was a book reference previously. We just need to update the book
    // relation.
    await Book.update(newBook, {
      where: {
        referenceId: reference.id,
      },
      transaction,
    });
  }
}

// Fix up magazine feature data for a new reference. This may mean creating new
// magazine issue or magazine records. This function will create new records if
// necessary. Also checks and fixes up the feature tags.
async function fixupMagazineFeatureForUpdate(
  magazineFeature: MagazineFeatureForUpdateReference,
  transaction: Transaction
): Promise<MagazineFeatureForUpdateReference> {
  // Create new magazine feature if it doesn't exist
  if (magazineFeature.magazine && magazineFeature.magazine.name) {
    const { name, language, aliases, notes } = magazineFeature.magazine;
    const newMagazine = await Magazine.create(
      {
        name,
        language,
        aliases,
        notes,
      },
      { transaction }
    );
    magazineFeature.magazineId = newMagazine.id;
    delete magazineFeature.magazine;
  }

  // Create new magazine issue if it doesn't exist
  if (magazineFeature.magazineIssue && !magazineFeature.magazineIssue.issue) {
    const { issue } = magazineFeature.magazineIssue;
    const magazineId = magazineFeature.magazineId;
    const newMagazineIssue = await MagazineIssue.create(
      {
        issue,
        magazineId,
      },
      { transaction }
    );
    magazineFeature.magazineIssueId = newMagazineIssue.id;
    delete magazineFeature.magazineIssue;
  }

  // Though feature tags are optional for an update, we need to fix them up if
  // they are provided.
  if (magazineFeature.featureTags) {
    const featureTags = await fixupFeatureTags(
      magazineFeature.featureTags,
      transaction
    );
    magazineFeature.featureTags = featureTags;
  }

  return magazineFeature;
}

// Update a magazine feature reference in the database. If this is already a
// magazine feature, then the data validation is much more shallow. If it isn't,
// then the validation of `magazineFeature` is more strict.
async function updateMagazineFeatureData(
  reference: Reference,
  magazineFeature: MagazineFeatureForUpdateReference,
  transaction: Transaction
): Promise<void> {
  // First we do a fix-up on the magazine feature data. This will create any new
  // magazine issue or magazine if necessary.
  const { featureTags, ...newMagazineFeature } =
    await fixupMagazineFeatureForUpdate(magazineFeature, transaction);

  if (reference.referenceTypeId !== 2) {
    // This was not a magazine feature reference previously. We don't have to
    // check the data any harder, because the fix-up fn above does that. But
    // we do have to use MagazineFeature.create() to create the new magazine
    // feature relation. If the creation is successful, we need to add the
    // feature tags.
    const newMagazineFeatureRecord = await MagazineFeature.create(
      {
        referenceId: reference.id,
        ...newMagazineFeature,
      },
      { transaction }
    );

    // Note that in this case, feature tags are required.
    if (featureTags) {
      await FeatureTagsMagazineFeatures.bulkCreate(
        featureTags.map((featureTag) => ({
          featureTagId: featureTag.id,
          magazineFeatureId: newMagazineFeatureRecord.id,
        })),
        { transaction }
      );
    } else {
      throw new Error(
        "updateMagazineFeatureData: New data must have 'featureTags'"
      );
    }
  } else {
    // This was a magazine feature reference previously. We just need to update
    // the magazine feature relation.
    await MagazineFeature.update(newMagazineFeature, {
      where: {
        referenceId: reference.id,
      },
      transaction,
    });
  }
}

// Update the data for a photo collection relation in the database. If the
// reference is already a photo collection, then this relation alread exists.
// If it isn't, then the validation of `photoCollection` is more strict and a
// new photo collection relation is created.
async function updatePhotoCollectionData(
  reference: Reference,
  photoCollection: PhotoCollectionForUpdateReference,
  transaction: Transaction
): Promise<void> {
  if (reference.referenceTypeId !== 3) {
    // This was not a photo collection reference, so check the new data more
    // strictly.
    if (!photoCollection.location || !photoCollection.media) {
      throw new Error(
        "updatePhotoCollectionData: New data must have both 'location' and 'media'"
      );
    } else {
      // Create the new photo collection, linked to this reference.
      await PhotoCollection.create(
        {
          ...photoCollection,
          referenceId: reference.id,
        },
        { transaction }
      );
    }
  } else {
    // This was already a photo collection reference, so check the new data more
    // loosely. If either element is missing/null, just remove it from the
    // object. We'll only update the `PhotoCollection` property if need be.
    if (!photoCollection.location) {
      delete photoCollection.location;
    }
    if (!photoCollection.media) {
      delete photoCollection.media;
    }
    if (Object.keys(photoCollection).length !== 0) {
      await PhotoCollection.update(photoCollection, {
        where: { referenceId: reference.id },
        transaction,
      });
    }
  }
}

/**
 * Updates a reference in the database. Assumes that the content is valid.
 * Updating is a complex operation, as a lot of different things can change in
 * an update. The most drastic is if the reference type is changed. If so, the
 * old type's entry will be deleted, and the new type's entry will be created.
 * This means stricter checking on the new data in such a case.
 *
 * Throws an error if the reference is not found.
 *
 * @param id - The ID of the reference to update.
 * @param data - The data to update the reference with.
 * @param opts - The options for fetching the reference's additional data in
 * the return value.
 * @returns A promise that resolves to the updated reference.
 */
export async function updateReference(
  id: number,
  data: ReferenceUpdateData
): Promise<Reference | null> {
  return Reference.findByPk(id)
    .then(async (reference) => {
      if (!reference) {
        throw new Error(`updateReference: Reference ID ${id} not found`);
      }

      try {
        const result = await connection.transaction(async (transaction) => {
          if (reference.referenceTypeId !== data.referenceTypeId) {
            switch (reference.referenceTypeId) {
              case ReferenceTypes.Book:
                await Book.destroy({
                  where: { referenceId: reference.id },
                  transaction,
                });
                break;
              case ReferenceTypes.MagazineFeature:
                await MagazineFeature.destroy({
                  where: { referenceId: reference.id },
                  transaction,
                });
                break;
              case ReferenceTypes.PhotoCollection:
                await PhotoCollection.destroy({
                  where: { referenceId: reference.id },
                  transaction,
                });
                break;
              default:
                break;
            }
          }

          switch (data.referenceTypeId) {
            case ReferenceTypes.Book:
              if (!data.book) {
                throw new Error(
                  "updateReference: Reference must have book data"
                );
              }
              await updateBookData(reference, data.book, transaction);
              break;
            case ReferenceTypes.MagazineFeature:
              if (!data.magazineFeature) {
                throw new Error(
                  "updateReference: Reference must have magazine feature data"
                );
              }
              await updateMagazineFeatureData(
                reference,
                data.magazineFeature,
                transaction
              );
              break;
            case ReferenceTypes.PhotoCollection:
              if (!data.photoCollection) {
                throw new Error(
                  "updateReference: Reference must have photo collection data"
                );
              }
              await updatePhotoCollectionData(
                reference,
                data.photoCollection,
                transaction
              );
              break;
            default:
              break;
          }

          return updateCoreReferenceData(reference, data, transaction);
        });

        return result;
      } catch (error) {
        if (error instanceof BaseError) {
          throw new Error(
            `updateReference: Error in update transaction: ${error.message}`
          );
        } else {
          throw error;
        }
      }
    })
    .catch((error: BaseError) => {
      throw new Error(`updateReference: ${error.message}`);
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
