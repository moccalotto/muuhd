export class FunctionCallParser {
    /**
     * @typedef {{name: string, args: Array<number|string|boolean|null>}} CallType
     */

    /**
     *
     * @param {string} input
     *
     * @returns {CallType[]}
     */
    parse(input) {
        const calls = [];
        const pattern = /(\w+)\s*\(([^)]*)\)/g;
        let match;

        while ((match = pattern.exec(input)) !== null) {
            const name = match[1];
            const argsStr = match[2].trim();
            const args = this.parseArguments(argsStr);

            calls.push({ name, args });
        }

        return calls;
    }

    /** @protected */
    parseArguments(argsStr) {
        if (!argsStr) return [];

        const args = [];
        const tokens = this.tokenize(argsStr);

        for (const token of tokens) {
            args.push(this.parseValue(token));
        }

        return args;
    }

    /** @protected */
    tokenize(argsStr) {
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
    parseValue(str) {
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
}
