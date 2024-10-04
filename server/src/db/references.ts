/*
  Database operations focused on the Reference model.
 */

import { BaseError, Transaction } from "sequelize";
import { match, P } from "ts-pattern";

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

// A local type for use in the fix-up functions for book references.
type BookForReferenceFixup = Omit<BookForReference, "isbn" | "seriesNumber">;

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

// Fix up book data for a new reference. This may mean creating a new publisher
// and/or series.
async function fixupBookForCreate(
  book: BookForReference,
  transaction: Transaction
): Promise<BookForReference> {
  const { isbn, seriesNumber, publisher, publisherId, series, seriesId } = book;
  const txn = { transaction };

  // There are a number of different cases that can occur here:
  //
  // 0. There is no publisher or series information of either form
  //    - This is valid, so don't need to do anything.
  // 1. There is `publisherId`, no series information
  //    - The book has a publisher that is already in the DB. Save the ID and
  //      let the `seriesId` remain null/undefined.
  // 2. There is `seriesId`, no publisher information
  //    - A `seriesId` by itself means to use an existing series for the book.
  //      Fetch the series record to see if it has a publisher. If so, save
  //      `seriesId` and `publisherId`, otherwise let the `publisherId` remain
  //      null/undefined.
  // 3. There is `publisherId` and `seriesId`
  //    - A `publisherId` and a `seriesId` means that the user has specified
  //      both in the form. Fetch the series record to ensure that the series
  //      and publisher match. If so, save `seriesId` and `publisherId`.
  //      Otherwise throw an error.
  // 4. There is `publisherId` and `series`
  //    - A `publisherId` and a `series` means that a new `Series` record will
  //      be created with the specified data and the `publisherId`.
  // 5. There is `publisher` and `seriesId`
  //    - A `publisher` and a `seriesId` is not allowed, as the series record
  //      either has a `publisherId` or doesn't. Either way, a totally-new
  //      publisher would conflict. Throw an error.
  // 6. There is `publisher` and no `series`
  //    - A `publisher` and no `series` means to create a new `Publisher`
  //      record with the specified data. There will be no series data.
  // 7. There is `series` and no `publisher`
  //    - A `series` and no `publisher` means to create a new `Series` record
  //      with the specified data. If the data has a `publisherId`, that
  //      publisher will be used. Otherwise, a new publisher will be created.
  // 8. There is `publisher` and `series`
  //    - A `publisher` and a `series` means that first a new `Publisher`
  //      record will be created with the specified data. Then a new `Series`
  //      record will be created with the specified data and the `publisherId`
  //      from the new `Publisher` record.
  //
  // Note that there are other combinations, but these are the only ones that
  // are important due to precedence.
  type MatchResult = {
    publisherId: number | null;
    seriesId: number | null;
  };
  const pubAndSeries = await match({
    publisherId,
    publisher,
    seriesId,
    series,
  } as BookForReferenceFixup)
    .returnType<Promise<MatchResult>>()
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: P.nullish,
      },
      async () => {
        // Case 0: No data, no worries
        return {
          publisherId: null,
          seriesId: null,
        };
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: P.nullish,
      },
      async (m) => {
        // Case 1: Publisher ID, no series info
        const publisher = await Publisher.findByPk(m.publisherId, txn);
        if (!publisher) {
          throw new Error("Publisher not found");
        }
        return {
          publisherId: m.publisherId,
          seriesId: null,
        };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.number,
        series: P.nullish,
      },
      async (m) => {
        // Case 2: Series ID, no publisher info
        const series = await Series.findByPk(m.seriesId, txn);
        if (!series) {
          throw new Error("Series not found");
        }
        return {
          publisherId: series.publisherId,
          seriesId: series.id,
        };
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.number,
        series: P.nullish,
      },
      async (m) => {
        // Case 3: Publisher ID and series ID
        const series = await Series.findByPk(m.seriesId, txn);
        if (!series) {
          throw new Error("Series not found");
        }
        if (series.publisherId !== m.publisherId) {
          throw new Error("Series and publisher do not match");
        }
        return {
          publisherId: m.publisherId,
          seriesId: m.seriesId,
        };
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: {
          name: P.optional(P.string),
          notes: P.optional(P.string),
          publisherId: P.optional(P.number),
        },
      },
      async (m) => {
        // Case 4: Publisher ID and series data
        const { name, notes } = m.series;
        if (!name) {
          throw new Error("Missing new series name");
        }

        const newSeries = await Series.create(
          { name, notes, publisherId: m.publisherId },
          txn
        );
        return { publisherId: m.publisherId, seriesId: newSeries.id };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: {},
        seriesId: P.number,
        series: P.nullish,
      },
      async () => {
        // Case 5: Publisher data and series ID, error
        throw new Error("Cannot specify `seriesId` with new `publisher` data");
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: { name: P.optional(P.string), notes: P.optional(P.string) },
        seriesId: P.nullish,
        series: P.nullish,
      },
      async (m) => {
        // Case 6: Publisher data only, no series data
        const { name, notes } = m.publisher;
        if (!name) {
          throw new Error("Missing new publisher name");
        }

        const newPublisher = await Publisher.create({ name, notes }, txn);
        return { publisherId: newPublisher.id, seriesId: null };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: {
          name: P.optional(P.string),
          notes: P.optional(P.string),
          publisherId: P.optional(P.number),
        },
      },
      async (m) => {
        // Case 7: Series data only, no publisher data
        const { name, notes, publisherId } = m.series;
        if (!name) {
          throw new Error("Missing new series name");
        }

        const newSeries = await Series.create(
          { name, notes, publisherId },
          txn
        );
        return { publisherId: publisherId ?? null, seriesId: newSeries.id };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: { name: P.optional(P.string), notes: P.optional(P.string) },
        seriesId: P.nullish,
        series: { name: P.optional(P.string), notes: P.optional(P.string) },
      },
      async (m) => {
        // Case 8: Publisher data and series data
        const { name: publisherName, notes: publisherNotes } = m.publisher;
        const { name: seriesName, notes: seriesNotes } = m.series;
        if (!publisherName) {
          throw new Error("Missing new publisher name");
        }
        if (!seriesName) {
          throw new Error("Missing new series name");
        }

        const newPublisher = await Publisher.create(
          { name: publisherName, notes: publisherNotes },
          txn
        );
        const newSeries = await Series.create(
          {
            name: seriesName,
            notes: seriesNotes,
            publisherId: newPublisher.id,
          },
          txn
        );
        return { publisherId: newPublisher.id, seriesId: newSeries.id };
      }
    )
    .otherwise(async () => {
      throw new Error("Invalid book data");
    });

  const fixed: BookForReference = { isbn, seriesNumber, ...pubAndSeries };
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
  const book = await fixupBookForCreate(data.book!, transaction);

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
// magazine issue and/or magazine records. Also checks and fixes up the feature
// tags.
async function fixupMagazineFeatureForCreate(
  magazineFeature: MagazineFeatureForNewReference,
  transaction: Transaction
): Promise<MagazineFeatureForNewReference> {
  // There are a number of different cases that can occur here:
  //
  // 0. Nothing is provided
  //    - If there is no `magazineId`, no `magazineIssueId`, and no new data for
  //      either, then throw an error.
  // 1. There is `magazineId`, no issue information
  //    - A `magazineId` by itself is not allowed. Information on the issue is
  //      also needed. Throw an error.
  // 2. There is `magazineIssueId`, no magazine information
  //    - A `magazineIssueId` by itself is fine, as it already has a magazine
  //      referenced. Save the `magazineIssueId` in the `MagazineFeature`
  //      record.
  // 3. There is `magazineId` and `magazineIssueId`
  //    - A `magazineId` and a `magazineIssueId` is not allowed, because the
  //      `magazineId` is at best redundant and possibly conflicting with the
  //      `magazineIssueId`. Throw an error.
  // 4. There is `magazineId` and `magazineIssue`
  //    - A `magazineId` and a `magazineIssue` means that a new `MagazineIssue`
  //      record will be created, pointing to the corresponding magazine. Its
  //      ID value will be stored in the `MagazineFeature` record.
  // 5. There is `magazine` and `magazineIssueId`
  //    - A `magazine` and a `magazineIssueId` is not allowed, as the magazine
  //      issue is already associated with another magazine. Throw an error.
  // 6. There is `magazine` and no `magazineIssue`
  //    - A `magazine` and no `magazineIssue` is an error because there is no
  //      way to associate the new magazine with an issue. Throw an error.
  // 7. There is `magazineIssue` and no `magazine`
  //    - A `magazineIssue` and no `magazine` is allowed only if the provided
  //      data includes a `magazineId`. Create a new `MagazineIssue` record and
  //      store its ID in the `MagazineFeature` record.
  // 8. There is `magazine` and `magazineIssue`
  //    - A `magazine` and a `magazineIssue` means that a new `Magazine` record
  //      will be created, and its ID will be used when creating the new
  //      `MagazineIssue` record. That record's ID will be stored in the
  //      `MagazineFeature` record.
  //
  // Note that there are other combinations, but these are the only ones that
  // are important due to precedence.

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

// Fix up magazine feature data for a reference update. This may mean creating
// new magazine issue or magazine records. This function will create new records
// if necessary. Also checks and fixes up the feature tags.
async function fixupBookForUpdate(
  existingBook: Book,
  book: BookForReference,
  transaction: Transaction
) {
  const {
    publisherId: existingPublisherId,
    series: existingSeries,
    seriesId: existingSeriesId,
  } = existingBook;
  const { isbn, seriesNumber, publisher, publisherId, series, seriesId } = book;
  const txn = { transaction };

  // There are a number of different cases that can occur here:
  //
  // 0. There is no publisher or series information of either form
  //    - This is valid, so don't need to do anything.
  // 1. There is `publisherId`, no series information
  //    - Check if the book already has a `seriesId`. If so, read the `Series`
  //      record to see if it has a publisher. If not, update the `Series`
  //      record with the `publisherId` and set the `publisherId` on the book
  //      record as well. If the series has a publisher and it matches the
  //      `publisherId` in the form, then don't need to do anything. If they
  //      do not match, throw an error. If there is no series, simply add the
  //      `publisherId` to the book record for updating.
  // 2. There is `seriesId`, no publisher information
  //    - A `seriesId` by itself means to use an existing series for the book.
  //      Fetch the series record to see if it has a publisher. If so, save
  //      `seriesId` and `publisherId`, otherwise let the `publisherId` remain
  //      null/undefined. If the book already has a `publisherId` and it is
  //      not the same as the `publisherId` from the series, then throw an
  //      error.
  // 3. There is `publisherId` and `seriesId`
  //    - A `publisherId` and a `seriesId` means that the user has specified
  //      both in the form. Fetch the series record to ensure that the series
  //      and publisher match. If so, save `seriesId` and `publisherId`.
  //      Otherwise throw an error.
  // 4. There is `publisherId` and `series`
  //    - A `publisherId` and a `series` means that a new `Series` record will
  //      be created with the specified data and the `publisherId`.
  // 5. There is `publisher` and `seriesId`
  //    - A `publisher` and a `seriesId` is not allowed, as the series record
  //      either has a `publisherId` or doesn't. Either way, a totally-new
  //      publisher would conflict. Throw an error.
  // 6. There is `publisher` and no `series`
  //    - For a `publisher` and no `series`, first check to see if the book
  //      already has a `seriesId`. If so, the new publisher would conflict
  //      with the series record. Throw an error. If not, create a new
  //      `Publisher` record with the specified data. Save the ID.
  // 7. There is `series` and no `publisher`
  //    - For a `series` and no `publisher` check to see if the book already
  //      has a `publisherId`. If so, check it against any potential value for
  //      `publisherId` in the series data. If they don't match, throw an error.
  //      If there is no conflict create a new `Series` record with the data and
  //      save the ID.
  // 8. There is `publisher` and `series`
  //    - A `publisher` and a `series` means that first a new `Publisher`
  //      record will be created with the specified data. Then a new `Series`
  //      record will be created with the specified data and the `publisherId`
  //      from the new `Publisher` record. These will replace any existing
  //      values in the book record.
  //
  // Note that there are other combinations, but these are the only ones that
  // are important due to precedence.
  //
  // Also note that, unlike the creation logic, we can't return `null` values
  // unless we intend to overwrite/clear-out any potential existing values.
  type MatchResult = {
    publisherId?: number | null;
    seriesId?: number | null;
  };
  const pubAndSeries = await match({
    publisherId,
    publisher,
    seriesId,
    series,
  } as BookForReferenceFixup)
    .returnType<Promise<MatchResult>>()
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: P.nullish,
      },
      async () => {
        // Case 0: No data, no worries. But only return `null` values if that
        // was explicitly passed in.
        const content: MatchResult = {};
        if (publisherId === null) {
          content.publisherId = publisherId;
        }
        if (seriesId === null) {
          content.seriesId = seriesId;
        }
        return content;
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: P.nullish,
      },
      async (m) => {
        // Case 1: Publisher ID, no series info. If there is an existing series,
        // the new `publisherId` must match unless `series.publisherId` is null.
        // If not, throw an error.
        const publisher = await Publisher.findByPk(m.publisherId, txn);
        if (!publisher) {
          throw new Error("Publisher not found");
        }
        // If the book already has a series associated with it, check that the
        // new publisher and series match. If not, throw an error.
        if (existingSeries && existingSeries.publisherId !== m.publisherId) {
          if (existingSeries.publisherId) {
            throw new Error("Publisher and existing series do not match");
          } else {
            await existingSeries.update({ publisherId: m.publisherId }, txn);
          }
        } else if (existingSeriesId) {
          const series = await Series.findByPk(existingSeriesId, txn);
          if (series?.publisherId !== m.publisherId) {
            if (series?.publisherId) {
              throw new Error("Publisher and existing series do not match");
            } else {
              await series?.update({ publisherId: m.publisherId }, txn);
            }
          }
        }

        return {
          publisherId: m.publisherId,
        };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.number,
        series: P.nullish,
      },
      async (m) => {
        // Case 2: Series ID, no publisher info. If there is an existing
        // publisher, the `publisherId` (if any) of the series will overwrite
        // it.
        const content: MatchResult = {};
        const series = await Series.findByPk(m.seriesId, txn);
        if (!series) {
          throw new Error("Series not found");
        } else {
          content.seriesId = series.id;
        }
        if (existingPublisherId && series.publisherId) {
          content.publisherId = series.publisherId;
        }

        return content;
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.number,
        series: P.nullish,
      },
      async (m) => {
        // Case 3: Publisher ID and series ID. The `publisherId` of the series
        // must match. If not, throw an error.
        const series = await Series.findByPk(m.seriesId, txn);
        if (!series) {
          throw new Error("Series not found");
        }
        if (series.publisherId !== m.publisherId) {
          throw new Error("Series and publisher IDs do not match");
        }

        return {
          publisherId: m.publisherId,
          seriesId: m.seriesId,
        };
      }
    )
    .with(
      {
        publisherId: P.number,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: {
          name: P.optional(P.string),
          notes: P.optional(P.string),
          publisherId: P.optional(P.number),
        },
      },
      async (m) => {
        // Case 4: Publisher ID and new series data. If the series data has a
        // `publisherId`, it will be ignored. The given `publisherId` will be
        // used in creating the new Series object.
        const { name, notes } = m.series;
        if (!name) {
          throw new Error("Missing new series name");
        }

        const newSeries = await Series.create(
          { name, notes, publisherId: m.publisherId },
          txn
        );

        return { publisherId: m.publisherId, seriesId: newSeries.id };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: {},
        seriesId: P.number,
        series: P.nullish,
      },
      async () => {
        // Case 5: New publisher data and series ID, error
        throw new Error("Cannot specify `seriesId` with new `publisher` data");
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: { name: P.optional(P.string), notes: P.optional(P.string) },
        seriesId: P.nullish,
        series: P.nullish,
      },
      async (m) => {
        // Case 6: Publisher data only, no series data. If there is an existing
        // series, it must have a `null` value for `publisherId`. If not, throw
        // an error. If there is a series with the `null` value, set its
        // `publisherId` to the new publisher's ID.
        const { name, notes } = m.publisher;
        let series;

        if (!name) {
          throw new Error("Missing new publisher name");
        }
        if (existingSeriesId) {
          // We check the ID first because it will always be set even if the
          // Series record is `null`.
          if (existingSeries) {
            if (existingSeries.publisherId) {
              throw new Error(
                "Existing series is already associated with a publisher"
              );
            }
          } else {
            series = await Series.findByPk(existingSeriesId, txn);
            if (series && series.publisherId) {
              throw new Error(
                "Existing series is already associated with a publisher"
              );
            }
          }
        }

        const newPublisher = await Publisher.create({ name, notes }, txn);
        if (series) {
          await series.update({ publisherId: newPublisher.id }, txn);
        }

        return { publisherId: newPublisher.id };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: P.nullish,
        seriesId: P.nullish,
        series: {
          name: P.optional(P.string),
          notes: P.optional(P.string),
          publisherId: P.optional(P.number),
        },
      },
      async (m) => {
        // Case 7: Series data only, no publisher data. If there is an existing
        // publisher and the series data has no `publisherId`, set the series'
        // data to the existing `publisherId`. If the series data has a
        // `publisherId`, it will be used in creating the new Series object and
        // will replace the existing `publisherId`.
        let pubIdToUse: number | null = null;
        const { name, notes, publisherId } = m.series;
        if (!name) {
          throw new Error("Missing new series name");
        }
        if (existingPublisherId && !publisherId) {
          pubIdToUse = existingPublisherId;
        }

        const newSeries = await Series.create({ name, notes, pubIdToUse }, txn);

        return { publisherId: newSeries.publisherId, seriesId: newSeries.id };
      }
    )
    .with(
      {
        publisherId: P.nullish,
        publisher: { name: P.optional(P.string), notes: P.optional(P.string) },
        seriesId: P.nullish,
        series: { name: P.optional(P.string), notes: P.optional(P.string) },
      },
      async (m) => {
        // Case 8: Publisher data and series data. Here, there is no need for
        // additional checks. These will both replace any existing data.
        const { name: publisherName, notes: publisherNotes } = m.publisher;
        const { name: seriesName, notes: seriesNotes } = m.series;
        if (!publisherName) {
          throw new Error("Missing new publisher name");
        }
        if (!seriesName) {
          throw new Error("Missing new series name");
        }

        const newPublisher = await Publisher.create(
          { name: publisherName, notes: publisherNotes },
          txn
        );
        const newSeries = await Series.create(
          {
            name: seriesName,
            notes: seriesNotes,
            publisherId: newPublisher.id,
          },
          txn
        );

        return { publisherId: newPublisher.id, seriesId: newSeries.id };
      }
    )
    .otherwise(async () => {
      throw new Error("Invalid book data");
    });

  const updated: BookForReference = { isbn, seriesNumber, ...pubAndSeries };
  return updated;
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
  // publisher if necessary. We can use `!` here, because `reference.book` has
  // already been validated.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const newBook = await fixupBookForUpdate(reference.book!, book, transaction);

  if (reference.referenceTypeId !== ReferenceTypes.Book) {
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

// Fix up magazine feature data for a reference update. This may mean creating
// new magazine issue or magazine records. This function will create new records
// if necessary. Also checks and fixes up the feature tags.
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
  // 0. Nothing is provided
  //    - If there is no magazine, no issue, and no new data for either, then do
  //      nothing.
  // 1. There is `magazineId`, nothing else
  //    - A `magazineId` by itself is not allowed. It would either be a
  //      different magazine than what the issue record points to, or it would
  //      be the same magazine (which would be a no-op). Throw an error.
  // 2. There is `magazineIssueId`, nothing else
  //    - A `magazineIssueId` by itself changes the corresponding value in the
  //      `MagazineFeature` record. It may or may not change what magazine the
  //      reference is associated with.
  // 3. There is `magazineId` and `magazineIssueId`
  //    - A `magazineId` and a `magazineIssueId` is not allowed, because the
  //      `magazineId` is at best redundant and possibly conflicting with the
  //      `magazineIssueId`. Throw an error.
  // 4. There is `magazineId` and `magazineIssue`
  //    - A `magazineId` and a `magazineIssue` means that a new MagazineIssue
  //      record will be created, pointing to the corresponding magazine. Its
  //      ID value will be stored in the `MagazineFeature` record.
  // 5. There is `magazine` and `magazineIssueId`
  //    - A `magazine` and a `magazineIssueId` is not allowed, as the magazine
  //      issue is already associated with another magazine. Throw an error.
  // 6. There is `magazine` and no `magazineIssue`
  //    - A `magazine` and no `magazineIssue` is an error because there is no
  //      way to associate the new magazine with an issue. Throw an error.
  // 7. There is `magazineIssue` and no `magazine`
  //    - A `magazineIssue` and no `magazine` means to create a new `magazine`
  //      issue record using the ID of the magazine that the record is currently
  //      associated with. The new issue's ID will be stored in the
  //      `MagazineFeature` record.
  // 8. There is `magazine` and `magazineIssue`
  //    - A `magazine` and a `magazineIssue` means that a new `Magazine` record
  //      will be created, and its ID will be used when creating the new
  //      `MagazineIssue` record. That record's ID will be stored in the
  //      `MagazineFeature` record.
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
  // Case 0. None of the four elements were present.

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

  if (reference.referenceTypeId !== ReferenceTypes.MagazineFeature) {
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

  if (reference.referenceTypeId !== ReferenceTypes.PhotoCollection) {
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
        throw new Error(`Reference ID ${id} not found`);
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
                throw new Error("Reference must have book data");
              }
              await updateBookData(reference, data.book, transaction);
              break;
            case ReferenceTypes.MagazineFeature:
              if (changingType && !data.magazineFeature) {
                throw new Error("Reference must have magazine feature data");
              }
              await updateMagazineFeatureData(
                reference,
                data.magazineFeature,
                transaction
              );
              break;
            case ReferenceTypes.PhotoCollection:
              if (changingType && !data.photoCollection) {
                throw new Error("Reference must have photo collection data");
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
          throw new Error(`Error in update transaction: ${error.message}`);
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
