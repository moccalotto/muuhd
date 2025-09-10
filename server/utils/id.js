import * as regex from "./regex.js";

const MINI_UID_REGEX = regex.pretty(
    "\.uid\.", //           Mini-uids always begin with ".uid."
    "[a-z0-9]{6,}$", //     Terminated by 6 or more random numbers and lowercase letters.
);
const ID_SANITY_REGEX = regex.pretty(
    "^:", //                All ids start with a colon
    "([a-z0-9]+\.)*?", //   Middle -optional- part :myid.gogle.thing.thang.thong
    "[a-z0-9_]+$", //       The terminating part of the id is numbers, lowercase letters, and -notably- underscores.
);

/**
 * Sanity check a string to see if it is a potential id.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isIdSane(id) {
    if (typeof id !== "string") {
        return false;
    }

    if (id.length < 2) {
        return false;
    }

    if (!ID_SANITY_REGEX.test(id)) {
        return false;
    }

    return true;
}

/**
 * @returns {string} crypto-unsafe pseudo random numbe"r.
 *
 * Generate a random number, convert it to base36, and return it as a string with 7-8 characters.
 */
export function miniUid() {
    // we use 12 digits, but we could go all the way to 16
    const digits = 12;
    return Number(Math.random().toFixed(digits).substring(2)).toString(36);
}

/**
 * Generate an id from a string
 * @param {string[]} str
 */
export function appendMiniUid(str) {
    return str + ".uid." + miniUid();
}

/**
 * Does a given string end with ".uid.23khtasdz", etc.
 *
 * @param {string} str
 */
export function endsWithMiniUid(str) {
    return MINI_UID_REGEX.test(str);
}

export function appendOrReplaceMiniUid(str) {
    return appendMiniUid(str.replace(MINI_UID_REGEX, ""));
}
