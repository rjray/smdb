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

// Fix up publisher data in a book reference. This may mean creating new
// publishers.
async function fixupPublisher(
  book: BookForReference,
  fixed: BookForReference,
  transaction: Transaction
): Promise<void> {
  if (book.publisher) {
    if (book.publisherId) {
      if (book.publisher.id) {
        if (book.publisherId === book.publisher.id) {
          // The publisher is already in the database. Don't need to create.
          fixed.publisherId = book.publisherId;
          return;
        } else {
          throw new Error(
            "fixupPublisher: Mismatch between publisherId and publisher data"
          );
        }
      } else {
        // No value in `book.publisher.id` but there is a `book.publisherId`,
        // so throw an error.
        throw new Error(
          "fixupPublisher: publisherId and publisher data are incompatible"
        );
      }
    } else {
      // No value in `book.publisherId` but there is a `book.publisher`, so
      // create a new publisher.
      const { name, notes } = book.publisher;
      if (name) {
        const newPublisher = await Publisher.create(
          { name, notes },
          { transaction }
        );

        fixed.publisherId = newPublisher.id;
        return;
      } else {
        throw new Error(
          "fixupPublisher: Publisher name is required to create a new publisher"
        );
      }
    }
  } else if (book.publisherId) {
    fixed.publisherId = book.publisherId;
    return;
  }
}

// Fix up series data in a book reference. This may mean creating a new series.
async function fixupSeries(
  book: BookForReference,
  fixed: BookForReference,
  transaction: Transaction
): Promise<void> {
  if (book.series) {
    if (book.seriesId) {
      if (book.series.id) {
        if (book.seriesId === book.series.id) {
          // The series is already in the database. Don't need to create.
          fixed.seriesId = book.seriesId;
          return;
        } else {
          throw new Error(
            "fixupSeries: Mismatch between seriesId and series data"
          );
        }
      } else {
        // No value in `book.series.id` but there is a `book.seriesId`, so
        // throw an error.
        throw new Error(
          "fixupSeries: seriesId and series data are incompatible"
        );
      }
    } else {
      // No value in `book.seriesId` but there is a `book.series`, so
      // create a new series.
      const { name, notes, publisherId: seriesPublisherId } = book.series;

      if (seriesPublisherId) {
        if (fixed.publisherId) {
          if (fixed.publisherId !== seriesPublisherId) {
            // The series publisher doesn't match the book publisher.
            throw new Error(
              "fixupSeries: Series publisher doesn't match book publisher"
            );
          }
        } else {
          fixed.publisherId = seriesPublisherId;
        }
      }

      if (name) {
        const newSeries = await Series.create(
          { name, notes, publisherId: fixed.publisherId },
          { transaction }
        );

        fixed.seriesId = newSeries.id;
        return;
      } else {
        throw new Error(
          "fixupSeries: Series name is required to create a new series"
        );
      }
    }
  } else if (book.seriesId) {
    fixed.seriesId = book.seriesId;
    const series = await Series.findByPk(book.seriesId, {
      transaction,
    });
    if (!series) {
      throw new Error("fixupSeries: Specified series not found");
    }

    if (fixed.publisherId) {
      if (fixed.publisherId !== series.publisherId) {
        // The series publisher doesn't match the book publisher.
        throw new Error(
          "fixupSeries: Series publisher doesn't match book-provided publisher"
        );
      }
    } else {
      if (series.publisherId) {
        fixed.publisherId = series.publisherId;
      }
    }

    return;
  }
}

// Fix up book data for a reference. This may mean creating new publishers and
// series.
async function fixupBook(
  book: BookForReference,
  transaction: Transaction
): Promise<BookForReference> {
  const fixed: BookForReference = {};
  fixed.seriesNumber = book.seriesNumber;
  fixed.isbn = book.isbn;

  // Create new publisher if it doesn't exist
  await fixupPublisher(book, fixed, transaction);
  // Create new series if it doesn't exist
  await fixupSeries(book, fixed, transaction);

  return fixed;
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
  if (!featureTags || featureTags.length === 0) {
    return []; // Nothing to do
  }

  // Create new feature feature tags if they don't exist.
  const fixedFeatureTags: Array<FeatureTagForReference> = [];
  for (const featureTag of featureTags) {
    // If the featureTag is already in the database, don't need to create.
    if (featureTag.id) {
      fixedFeatureTags.push(featureTag);
    } else if (featureTag.name) {
      const newTag = await FeatureTag.create(
        { name: featureTag.name },
        { transaction }
      );
      fixedFeatureTags.push({ id: newTag.id, name: newTag.name });
    } else {
      throw new Error(
        "fixupFeatureTags: Tag name is required to create a new feature tag"
      );
    }
  }

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
  if (!magazineFeature.magazineId) {
    throw new Error("fixupMagazineFeatureForCreate: magazineId is required");
  }

  // Create new magazine issue if it doesn't exist
  if (magazineFeature.magazineIssue && magazineFeature.magazineIssue.issue) {
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
  if (!magazineFeature.magazineIssueId) {
    throw new Error(
      "fixupMagazineFeatureForCreate: magazineIssueId is required"
    );
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
  const magazineFeatureData = await fixupMagazineFeatureForCreate(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.magazineFeature!,
    transaction
  );
  const { featureTags, ...magazineFeature } = magazineFeatureData;

  // These are the fields that are directly added to the reference.
  const { name, language, referenceTypeId } = data;

  const reference = await Reference.create(
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

  if (featureTags) {
    // Add the feature tags.

    if (featureTags.length === 0) {
      throw new Error(
        "addMagazineFeatureReference: featureTags cannot be an empty array"
      );
    } else {
      // This won't be null because we just created the reference. The creation
      // would have thrown an error if it failed.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await reference.magazineFeature!.addFeatureTags(featureTags, {
        transaction,
      });
    }
  }

  return reference;
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
export async function createReference(
  data: ReferenceNewData
): Promise<Reference> {
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
export function getAllReferences(opts: RequestOpts = {}): Promise<Reference[]> {
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
export function getReferenceById(
  id: number,
  opts: RequestOpts = {}
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
    await reference.removeAuthors({ transaction });
    await reference.addAuthors(newAuthors, { transaction });
  }
  // Note that while tags are required, they aren't necessary for an update.
  // But if the value is provided, we need to fix it up.
  if (tags && tags.length > 0) {
    const newTags = await fixupTags(tags, transaction);
    await reference.removeTags({ transaction });
    await reference.addTags(newTags, { transaction });
  }

  // Update the basic data. This also returns the updated reference instance.
  if (name) {
    data.name = name;
  }
  if (language) {
    data.language = language;
  }
  await reference.update(data, { transaction });

  return;
}

// Update the data for a book relation in the database. If the reference is
// already a book, then the data validation is much more shallow and the
// existing book relation is updated. If it isn't currently a book, then the
// validation of `book` is more strict and a new book relation is created.
async function updateBookData(
  reference: Reference,
  book: BookForReference | undefined,
  transaction: Transaction
): Promise<void> {
  if (!book) {
    // Ths update doesn't change any of the book data.
    return;
  }

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
  existingMagazineFeature: MagazineFeature,
  magazineFeature: MagazineFeatureForUpdateReference,
  transaction: Transaction
): Promise<MagazineFeatureForUpdateReference> {
  const newMagazineFeature: MagazineFeatureForUpdateReference = {};
  const { featureTags, magazine, magazineId, magazineIssue, magazineIssueId } =
    magazineFeature;

  // There are a number of different cases that can occur here:
  //
  // 1. There is magazineId, nothing else:
  //    - A magazineId by itself is not allowed. It would either be a different
  //      magazine than what the issue record points to, or it would be the
  //      same magazine (which would be a no-op). Throw an error.
  // 2. There is magazineIssueId, nothing else
  //    - A magazineIssueId by itself changes the corresponding value in the
  //      MagazineFeature record. It may or may not change what magazine the
  //      reference is associated with.
  // 3. There is magazineId and magazineIssueId
  //    - A magazineId and a magazineIssueId is not allowed, because the
  //      magazineId is at best redundant and possibly conflicting with the
  //      magazineIssueId. Throw an error.
  // 4. There is magazineId and magazineIssue
  //    - A magazineId and a magazineIssue means that a new MagazineIssue
  //      record will be created, pointing to the corresponding magazine. Its
  //      ID value will be stored in the MagazineFeature record.
  // 5. There is magazine and magazineIssueId
  //    - A magazine and a magazineIssueId is not allowed, as the magazine
  //      issue is already associated with another magazine. Throw an error.
  // 6. There is magazine and no magazineIssue
  //    - A magazine and no magazineIssue is an error because there is no way
  //      to associate the new magazine with an issue. Throw an error.
  // 7. There is magazineIssue and no magazine
  //    - A magazineIssue and no magazine means to create a new magazine issue
  //      record using the ID of the magazine that the record is currently
  //      associated with. The new issue's ID will be stored in the
  //      MagazineFeature record.
  // 8. There is magazine and magazineIssue
  //    - A magazine and a magazineIssue means that a new Magazine record will
  //      be created, and its ID will be used when creating the new
  //      MagazineIssue record. That record's ID will be stored in the
  //      MagazineFeature record.
  // 9. Nothing is provided:
  //    - If there is no magazine, no issue, and no new data for either, then do
  //      nothing.
  //
  // Note that there are other combinations, but these are the only ones that
  // are important due to precedence.

  // Check for `magazineId` first.
  if (magazineId) {
    if (magazineIssueId) {
      // Case 3. Error.
      throw new Error(
        "fixupMagazineFeatureForUpdate: magazineId and magazineIssueId " +
          "cannot both be provided"
      );
    } else if (magazineIssue) {
      // Case 4. Create new magazine issue, using the provided `magazineId`.
      const { issue } = magazineIssue;
      if (issue) {
        const newMagazineIssue = await MagazineIssue.create(
          {
            issue,
            magazineId,
          },
          { transaction }
        );
        newMagazineFeature.magazineIssueId = newMagazineIssue.id;
      } else {
        // Absence of `issue`, cannot proceed.
        throw new Error(
          "fixupMagazineFeatureForUpdate: magazineId without magazineIssue " +
            "`issue`data is not allowed"
        );
      }
    } else {
      // Case 1. Error.
      throw new Error(
        "fixupMagazineFeatureForUpdate: magazineId without magazineIssue " +
          "data is not allowed"
      );
    }
  } else if (magazineIssueId) {
    if (magazine) {
      // Case 5. Error.
      throw new Error(
        "fixupMagazineFeatureForUpdate: magazineIssueId cannot be provided " +
          "with magazine data"
      );
    } else {
      // Case 2. Simply set up the update of the feature.
      newMagazineFeature.magazineIssueId = magazineIssueId;
    }
  } else if (magazine) {
    if (magazineIssue) {
      // Case 8. Create new Magazine, using the provided data. Use the new ID
      // in the creation of a new MagazineIssue record.
      const { name, language, aliases, notes } = magazine;
      const newMagazine = await Magazine.create(
        {
          name,
          language,
          aliases,
          notes,
        },
        { transaction }
      );
      const { issue } = magazineIssue;
      if (issue) {
        const newMagazineIssue = await MagazineIssue.create(
          {
            issue,
            magazineId: newMagazine.id,
          },
          { transaction }
        );
        newMagazineFeature.magazineIssueId = newMagazineIssue.id;
      }
    } else {
      // Case 6. Error.
      throw new Error(
        "fixupMagazineFeatureForUpdate: magazine data without magazineIssue " +
          "data is not allowed"
      );
    }
  } else if (magazineIssue) {
    // Case 7. By default, we know that there is no `magazine` or `magazineId`
    // provided. Create a new issue using the data in `magazineIssue`. If the
    // data does not include `magazineId`, then use the ID of the magazine the
    // record is currently associated with.
    const { issue, magazineId } = magazineIssue;
    if (!issue) {
      throw new Error(
        "fixupMagazineFeatureForUpdate: magazineIssue without issue data " +
          "is not allowed"
      );
    } else {
      if (magazineId) {
        const newMagazineIssue = await MagazineIssue.create(
          {
            issue,
            magazineId,
          },
          { transaction }
        );
        newMagazineFeature.magazineIssueId = newMagazineIssue.id;
      } else {
        // If there is no `magazineId`, then the issue is associated with the
        // magazine that the feature is currently associated with. We just have
        // to get that.
        if (existingMagazineFeature.magazineIssue?.magazineId) {
          const { magazineId } = existingMagazineFeature.magazineIssue;
          const newMagazineIssue = await MagazineIssue.create(
            {
              issue,
              magazineId,
            },
            { transaction }
          );
          newMagazineFeature.magazineIssueId = newMagazineIssue.id;
        } else {
          throw new Error(
            "fixupMagazineFeatureForUpdate: Unable to derive `magazineId` " +
              "from `magazineIssue`"
          );
        }
      }
    }
  }
  // Case 9. None of the four elements were present.

  // Though feature tags are optional for an update, we need to fix them up if
  // they are provided.
  if (featureTags) {
    // If present, `featureTags` cannot be empty.
    if (featureTags.length) {
      const newFeatureTags = await fixupFeatureTags(featureTags, transaction);
      newMagazineFeature.featureTags = newFeatureTags;
    } else {
      throw new Error(
        "fixupMagazineFeatureForUpdate: featureTags cannot be empty"
      );
    }
  }

  return newMagazineFeature;
}

// Update a magazine feature reference in the database. If this is already a
// magazine feature, then the data validation is much more shallow. If it isn't,
// then the validation of `magazineFeature` is more strict.
async function updateMagazineFeatureData(
  reference: Reference,
  magazineFeature: MagazineFeatureForUpdateReference | undefined,
  transaction: Transaction
): Promise<void> {
  if (!magazineFeature) {
    // Ths update doesn't change any of the magazine feature data.
    return;
  }

  // First we do a fix-up on the magazine feature data. This will create any new
  // magazine issue or magazine if necessary.
  const { featureTags, ...newMagazineFeature } =
    await fixupMagazineFeatureForUpdate(
      // OK to use `!` here, because `magazineFeature` is known to be defined.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      reference.magazineFeature!,
      magazineFeature,
      transaction
    );

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
    if (!newMagazineFeatureRecord) {
      throw new Error("updateMagazineFeatureData: Failed to create new record");
    }

    // Note that in this case, feature tags are required.
    if (featureTags && featureTags.length > 0) {
      await newMagazineFeatureRecord.addFeatureTags(featureTags, {
        transaction,
      });
    } else {
      throw new Error(
        "updateMagazineFeatureData: New data must have 'featureTags'"
      );
    }
  } else {
    // This was a magazine feature reference previously. We just need to update
    // the magazine feature relation.
    if (reference.magazineFeature) {
      await reference.magazineFeature.update(newMagazineFeature, {
        transaction,
      });
      if (featureTags) {
        await reference.magazineFeature.removeFeatureTags({
          transaction,
        });
        await reference.magazineFeature.addFeatureTags(featureTags, {
          transaction,
        });
      }
    } else {
      throw new Error(
        "updateMagazineFeatureData: No magazineFeature property on reference"
      );
    }
  }
}

// Update the data for a photo collection relation in the database. If the
// reference is already a photo collection, then this relation alread exists.
// If it isn't, then the validation of `photoCollection` is more strict and a
// new photo collection relation is created.
async function updatePhotoCollectionData(
  reference: Reference,
  photoCollection: PhotoCollectionForUpdateReference | undefined,
  transaction: Transaction
): Promise<void> {
  if (!photoCollection) {
    // Ths update doesn't change any of the photo collection data.
    return;
  }

  const collection = { ...photoCollection };

  if (reference.referenceTypeId !== 3) {
    // This was not a photo collection reference, so check the new data more
    // strictly.
    if (!collection.location || !collection.media) {
      throw new Error(
        "updatePhotoCollectionData: New data must have both 'location' and 'media'"
      );
    } else {
      // Create the new photo collection, linked to this reference.
      await PhotoCollection.create(
        {
          ...collection,
          referenceId: reference.id,
        },
        { transaction }
      );
    }
  } else {
    // This was already a photo collection reference, so check the new data more
    // loosely. If either element is missing/null, just remove it from the
    // object. We'll only update the `PhotoCollection` property if need be.
    if (!collection.location) {
      delete collection.location;
    }
    if (!collection.media) {
      delete collection.media;
    }
    if (Object.keys(collection).length !== 0) {
      // Update the photo collection.
      if (reference.photoCollection) {
        await reference.photoCollection.update(collection, {
          transaction,
        });
      } else {
        await PhotoCollection.update(collection, {
          where: { referenceId: reference.id },
          transaction,
        });
      }
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
 * @param dataIn - The data to update the reference with.
 * @param opts - The options for fetching the reference's additional data in
 * the return value.
 * @returns A promise that resolves to the updated reference.
 */
export async function updateReferenceById(
  id: number,
  dataIn: ReferenceUpdateData
): Promise<Reference | null> {
  const data = { ...dataIn };

  return Reference.findByPk(id)
    .then(async (reference) => {
      if (!reference) {
        throw new Error(`updateReference: Reference ID ${id} not found`);
      }
      data.referenceTypeId = data.referenceTypeId || reference.referenceTypeId;
      const changingType = reference.referenceTypeId !== data.referenceTypeId;

      try {
        await connection.transaction(async (transaction) => {
          if (changingType) {
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
              if (changingType && !data.book) {
                throw new Error(
                  "updateReference: Reference must have book data"
                );
              }
              await updateBookData(reference, data.book, transaction);
              break;
            case ReferenceTypes.MagazineFeature:
              if (changingType && !data.magazineFeature) {
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
              if (changingType && !data.photoCollection) {
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

          await updateCoreReferenceData(reference, data, transaction);
        });

        return Reference.findByPk(id);
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
export function deleteReferenceById(id: number) {
  return Reference.destroy({ where: { id } });
}
