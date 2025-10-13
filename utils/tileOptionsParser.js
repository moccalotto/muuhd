/** A call represents the name of a function as well as the arguments passed to it */
export class TileOptions {
    /** @type {string} Name of the function            */ name;
    /** @type {TileArgs[]} Args passed to function     */ args;

    constructor(name, args) {
        this.name = name;
        this.args = args;
    }

    /**
     * @param {string} name
     * @param {Record<string,any>} args
     */
    static fromObject(name, args) {
        //
        const result = new TileOptions(name, []);

        for (const [k, v] of Object.entries(args)) {
            const arg = new TileArgs(k, v);
            result.args.push(arg);
        }

        return result;
    }

    /**
     * Find an arg by name, but fall back to an index position
     *
     * @param {string} name
     * @param {number?} position
     *
     * @returns {TileArgs|null}
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

    /**
     * @param {boolean} includePositionals Should the result object include numeric entries for the positional arguments?
     * @returns {object} object where the keys are the names of the named args, and the values are the values of those args.
     */
    getNamedValues(includePositionals = false) {
        const result = {};

        for (const arg of this.args) {
            const key = arg.key;

            if (includePositionals || typeof key === "string") {
                result[key] = arg;
            }
        }

        return result;
    }
}

/** An argument passed to a function. Can be positional or named */
export class TileArgs {
    /** @type {string|number}                           */ key;
    /** @type {string|number|boolean|null|undefined}    */ value;
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

/**
 * Parse a string of options that looks like function calls separated by ";" semicolons
 *
 * @param {string} input
 *
 * @returns {TileOptions[]}
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
    const pattern = /(\w+)\s*\(([^)]*)\)/gu;
    let match;

    while ((match = pattern.exec(input)) !== null) {
        let name = match[1];
        const argsStr = match[2].trim();
        const args = parseArguments(argsStr);

        // Hack to allow special characters in option names
        // If the option name is "__", then the actual
        // option name is given by arg 0, and arg 0 is then
        // automatically removed.
        //
        // So
        //      __(foo, 1,2,3) ===  foo(1,2,3)
        //      __("·", 1,2,3) === ·(1,2,3)
        //      __("(", 1,2,3) === ((1,2,3)
        //      __('"', 1,2,3) === '(1,2,3)

        if (name === "__") {
            name = args.shift().value;
        }

        calls.push(new TileOptions(name, args));
    }

    return calls;
}

/**
 * @param {string} argsStr
 * @returns {TileArgs[]}
 */
function parseArguments(argsStr) {
    if (!argsStr) return [];

    /** @type {TileArgs[]} */
    const args = [];
    const tokens = tokenize(argsStr);

    for (const pos in tokens) {
        const token = tokens[pos];
        const namedMatch = token.match(/^(\w+)=(.+)$/);
        if (namedMatch) {
            args.push(new TileArgs(namedMatch[1], parseValue(namedMatch[2])));
        } else {
            args.push(new TileArgs(Number.parseInt(pos), parseValue(token)));
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
        const f = parseFloat(str);
        const rounded = Math.round(f);
        const diff = Math.abs(rounded - f);
        const epsilon = 1e-6; // MAGIC NUMBER
        if (diff < epsilon) {
            return rounded;
        }

        return f;
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
