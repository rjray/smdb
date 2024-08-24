/*
  Miscellaneous utility functions.
 */

/**
 * Create a function that sorts objects by the given key. Takes a key and
 * returns a function that compares two objects by that key. Does basic type-
 * checking to ensure that the key is a valid key of the object. Loosely based
 * on the `sortBy` function from
 * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
 *
 * @param key - The key to sort the objects by.
 * @returns Function that sorts objects by the given key.
 */
export const sortBy = <T extends object, K extends keyof T>(key: K) => {
  return (a: T, b: T) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0);
};

/**
 * Simple function to check if an object or array is empty.
 *
 * @param obj - Object or array to check for emptiness.
 * @returns Boolean indicating whether the object or array is empty.
 */
export const isEmpty = (obj: object) => !Object.entries(obj || {}).length;

/**
 * Compares two version strings.
 *
 * Adapted from my JavaScript implementation, itself adapted from:
 * https://helloacm.com/the-javascript-function-to-compare-version-number-strings/
 *
 * @param a - The first version string.
 * @param b - The second version string.
 * @returns A number indicating the comparison result:
 *          - >0 if `a` is greater than `b`.
 *          - <0 if `a` is less than `b`.
 *          - 0 if `a` is equal to `b`.
 */
export const compareVersion = (a: string, b: string) => {
  if (a.match(/[^.\d]/) || b.match(/[^.\d]/)) {
    return a.localeCompare(b);
  }

  const aList = a.split(".");
  const bList = b.split(".");
  const k = Math.min(aList.length, bList.length);
  for (let i = 0; i < k; ++i) {
    const aVal = parseInt(a[i], 10);
    const bVal = parseInt(b[i], 10);
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }

  return aList.length - bList.length;
};
