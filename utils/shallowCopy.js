/**
 * Shallow copy any JS value if it makes sense.
 * @param {*} value
 * @returns {*}
 */
export default function shallowCopy(value) {
    if (value === null || typeof value !== "object") {
        // primitives, functions, symbols
        return value;
    }

    if (Array.isArray(value)) {
        return value.slice();
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    if (value instanceof Map) {
        return new Map(value);
    }

    if (value instanceof Set) {
        return new Set(value);
    }

    // Plain objects
    if (Object.getPrototypeOf(value) === Object.prototype) {
        return Object.assign({}, value);
    }

    if (typeof value?.clone === "function") {
        return value.clone();
    }

    // Fallback: clone prototype + own props
    return Object.create(
        Object.getPrototypeOf(value), //
        Object.getOwnPropertyDescriptors(value),
    );
}
