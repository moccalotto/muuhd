const UID_DIGITS = 12;
const MINI_UID_REGEX = /\.uid\.[a-z0-9]{6,}$/;
const ID_SANITY_REGEX = /^:([a-z0-9]+\.)*[a-z0-9_]+$/;

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

    return ID_SANITY_REGEX.test(id);
}

/**
 * @returns {string} crypto-unsafe pseudo random number.
 *
 * Generate a random number, convert it to base36, and return it as a string with 7-8 characters.
 */
export function miniUid() {
    // we use 12 digits, but we could go up to 16
    return Number(Math.random().toFixed(UID_DIGITS).substring(2)).toString(36);
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
