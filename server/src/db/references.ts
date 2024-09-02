/*
  Database operations focused on the Reference model.
 */

import { BaseError } from "sequelize";

import { Reference, Author, Tag, FeatureTag } from "models";
import { ReferenceUpdateData, ReferenceNewData } from "types/reference";
import { AuthorForReference } from "types/author";
import { TagForReference } from "types/tag";
import { FeatureTagForReference } from "types/featuretag";
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

// Fix up the list of feature tags for a magazine feature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

async function addBookReference(data: ReferenceNewData) {
  const authors = await fixupAuthors(data.authors);
  const tags = await fixupTags(data.tags);
  const include = [Author, Tag];

  return Reference.create(
    {
      name: data.name,
      language: data.language,
      referenceTypeId: data.referenceTypeId,
      authors: authors,
      tags: tags,
      book: data.book,
    },
    {
      include,
    }
  );
}

/**
 * Add a reference to the database. This requires a lot of checking of the data
 * before it is added to the database. It is necessary to determine which of
 * the three sub-types of reference is being created, as well as check for
 * authors and tags.
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
      break;
    case 3:
      if (!data.photoCollection) {
        throw new Error("Reference must have photo collection data");
      }
      break;
    default:
      throw new Error("Invalid reference type ID");
  }

  return Reference.create(data);
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
