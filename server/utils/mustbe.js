export function mustBe(value, ...types) {
    //
    // empty type enforcement.
    // Means we just want value to be define
    if (types.length === 0 && typeof value !== "undefined") {
        return value;
    }

    //
    // value has a valid type
    if (types.includes(typeof value)) {
        return value;
    }

    // NOTE: only checks first element of array if it's a string.
    if (types.includes("strings[]") && Array.isArray(value) && (value.length === 0 || typeof value[0] === "string")) {
        return value;
    }

    throw new Error("Invalid data type. Expected >>" + types.join(" or ") + "<< but got " + typeof value);
}

export function mustBeString(value) {
    return mustBe(value, "string");
}

export function mustBeInteger(value) {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
    }
}

/**
 *
 * @param {string} str
 * @param {RegExp} regex
 */
export function mustMatch(str, regex) {
    if (!regex.test(str)) {
        throw new Error(`String did not satisfy ${regex}`);
    }

    return str;
}
