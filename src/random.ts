/**
 * Randomness utility functions.
 */

import seedrandom from "seedrandom";
import { RANDOMNESS_SEED } from "./options";
import { ALPHABET } from "./constants";

/** Pseudo random number generator */
export const random = seedrandom(RANDOMNESS_SEED);

/**
 * Select random items from a list. The number of items to be selected
 * is randomly chosen from a value between the minimum and maximum number.
 * The default minimum and maximum number is 1, so if only the list is given,
 * only one random item is selected.
 *
 * If the number of items to be chosen is greater that the number of items in the list,
 * the entire list is returned
 *
 * @param list the list from which items are randomly selected of
 * @param minNumberOfItems the minimum number of items to be chosen
 * @param maxNumberOfItems the maximum number of items to be chosen
 * @return the list containing the randomly selected items
 */
export function getRandomItems<T>(
    list: Iterable<T>,
    minNumberOfItems = 1,
    maxNumberOfItems = 1,
): T[] {
    const shuffledList = [...list].sort(() => random() - 0.5);
    return shuffledList.slice(
        0,
        Math.floor(random() * (maxNumberOfItems - minNumberOfItems)) + minNumberOfItems,
    );
}

/**
 * Generates a random alphanumeric string.
 *
 * @param length - the length of the random string
 * @returns a random alphanumeric string of the given length
 */
export function randomString(length: number): string {
    const randomNum = () => Math.floor(random() * ALPHABET.length);
    return Array.from({ length: length }, randomNum)
        .map((i) => ALPHABET.charAt(i))
        .join("");
}

/**
 * List of generated tokens. All tokens are unique.
 */
export const tokens: string[] = [];

/**
 * Generates a random token, which is a random alphanumeric string of length 40.
 * The token is guaranteed to be unique in the list of tokens.
 */
export function randomToken(): string {
    let token = randomString(40);
    while (tokens.some((t) => t == token)) {
        token = randomString(40);
    }
    tokens.push(token);
    return token;
}

/**
 * Creates a random date in between the provided ones.
 *
 * @param from the earliest date to be generated
 * @param to the latest date to be generated
 * @returns a date in between `from` and `to`
 */
export function getRandomDateBetween(from: Date, to: Date) {
    const fromInMS = from.getTime();
    const toInMS = to.getTime();
    return new Date(fromInMS + random() * (toInMS - fromInMS));
}
