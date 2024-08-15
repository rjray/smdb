import { Author } from "models";

export function fetchAllAuthors() {
  return Author.findAll().then((authors) => authors);
}
