export function cleanName(s) {
    if (typeof s !== "string") {
        throw new Error("String expected, but got a ", typeof s);
    }
    return s.toLowerCase().replace(" ", "_").replace(/[^a-zA-Z0-9_]/, "_");
}

/**
 * Generate a random number, convert it to base36, and return it as a string with 7-8 characters.
 */
export function miniUid() {
    // we use 12 digits, but we could go up to 16
    return Number(Math.random().toFixed(12).substring(2)).toString(36);
}

/**
 * Generate an id from a name
 */
export function fromName(...names) {
    let res = "";
    for (const name of names) {
        res += ":" + cleanName(name);
    }

    return res + ":" + miniUid();
}
