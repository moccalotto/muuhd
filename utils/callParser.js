/** A call represents the name of a function as well as the arguments passed to it */
export class ParsedCall {
    /** @type {string} Name of the function             */ name;
    /** @type {ParsedArg[]} Args passed to function     */ args;

    constructor(name, args) {
        this.name = name;
        this.args = args;
    }

    /**
     * Find an arg by name, but fall back to an index position
     *
     * @param {string} name
     * @param {number?} position
     *
     * @returns {ParsedArg|null}
     */
    getArg(name, position) {
        for (let idx in this.args) {
            const arg = this.args[idx];

            if (name === arg.key) {
                return arg;
            }
        }

        return this.args[position] ?? null;
    }

    getValue(name, position, fallbackValue = undefined) {
        const arg = this.getArg(name, position);
        return arg ? arg.value : fallbackValue;
    }
}

/** An argument passed to a function. Can be positional or named */
export class ParsedArg {
    /** @type {string|number}                           */ key;
    /** @type {string|number|boolean|null|undefined}    */ value;
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

/**
 * Parse a string that includes a number of function calls separated by ";" semicolons
 *
 * @param {string} input
 *
 * @returns {ParsedCall[]}
 *
 * @example
 * // returns
 * // [
 * //     {name="O", args=[{ key: 0, value: 1 }]},
 * //     {name="P", args=[{ key: "orientation", value: "north" }]},
 * //     {name="E", args=[{ key: 0, value: "Gnolls" }, { key: "texture", value: "gnolls" }]},
 * // ];
 *
 * parse(`O(1); P(orientation=north); E(Gnolls, texture=gnolls)`)
 *
 */
export default function parse(input) {
    const calls = [];
    const pattern = /(\w+)\s*\(([^)]*)\)/g; // TODO: expand so identifiers can be more than just \w characters - also limit identifiers to a single letter (maybne)
    let match;

    while ((match = pattern.exec(input)) !== null) {
        let name = match[1];
        const argsStr = match[2].trim();
        const args = parseArguments(argsStr);

        // Hack to allow special characters in function names
        // If function name is "__", then
        // the actual function name is given by arg 0.
        // Arg zero is automatically removed when the
        // name is changed.
        //
        // So
        //      __(foo, 1,2,3)  ===  foo(1,2,3)
        //      __("·", 1,2,3) === ·(1,2,3)
        //      __("(", 1,2,3) === ((1,2,3)
        //      __('"', 1,2,3) === '(1,2,3)

        if (name === "__") {
            name = args.shift().value;
        }

        calls.push(new ParsedCall(name, args));
    }

    return calls;
}

/**
 * @param {string} argsStr
 * @returns {ParsedArg[]}
 */
function parseArguments(argsStr) {
    if (!argsStr) return [];

    /** @type {ParsedArg[]} */
    const args = [];
    const tokens = tokenize(argsStr);

    for (const pos in tokens) {
        const token = tokens[pos];
        const namedMatch = token.match(/^(\w+)=(.+)$/);
        if (namedMatch) {
            args.push(new ParsedArg(namedMatch[1], parseValue(namedMatch[2])));
        } else {
            args.push(new ParsedArg(Number.parseInt(pos), parseValue(token)));
        }
    }

    return args;
}

/** @protected */
function tokenize(argsStr) {
    const tokens = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];

        if (char === "(" || char === "[" || char === "{") {
            depth++;
            current += char;
        } else if (char === ")" || char === "]" || char === "}") {
            depth--;
            current += char;
        } else if (char === "," && depth === 0) {
            if (current.trim()) {
                tokens.push(current.trim());
            }
            current = "";
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        tokens.push(current.trim());
    }

    return tokens;
}

/** @protected */
function parseValue(str) {
    str = str.trim();

    // Try to parse as number
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str);
    }

    // Boolean
    if (str === "true") return true;
    if (str === "false") return false;

    // Null/undefined
    if (str === "null") return null;

    // Otherwise treat as string (remove quotes if present)
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
    }

    return str;
}
