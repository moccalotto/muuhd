/**
 * Parse a command string into arguments. For use with colon-commands.
 *
 * @param {string} cmdString;
 * @returns {(string|number)[]} Command arguments
 */
export function parseArgs(cmdString) {
    if (typeof cmdString !== "string") {
        throw new Error("Expected string. GoT a finger in the eye instead");
    }
    const args = [];
    const quoteChars = ["'", '"', "`"];
    const backslash = "\\";

    let currentArg = ""; // The arg we are currently constructing
    let inQuotes = false; // are we inside quotes of some kind?
    let currentQuoteChar = ""; // if were in quotes, which are they?

    // helper function
    const pushVal = (value) => {
        const n = Number(value);
        if (Number.isSafeInteger(n)) {
            args.push(n);
        } else if (Number.isFinite(n)) {
            args.push(n);
        } else {
            args.push(value);
        }
    };

    for (let i = 0; i < cmdString.length; i++) {
        const char = cmdString[i];
        const nextChar = cmdString[i + 1];

        if (!inQuotes) {
            // Not in quotes - look for quote start or whitespace
            if (quoteChars.includes(char)) {
                inQuotes = true;
                currentQuoteChar = char;
            } else if (char === " " || char === "\t") {
                // Whitespace - end current arg if it exists
                if (currentArg) {
                    pushVal(currentArg);
                    currentArg = "";
                }
                // Skip multiple whitespace
                while (cmdString[i + 1] === " " || cmdString[i + 1] === "\t") i++;
            } else {
                currentArg += char;
            }
        } else {
            // Inside quotes
            if (char === currentQuoteChar) {
                // Found matching quote - end quoted section
                inQuotes = false;
                currentQuoteChar = "";
            } else if (char === backslash && (nextChar === currentQuoteChar || nextChar === backslash)) {
                // Escape sequence - add the escaped character
                currentArg += nextChar;
                //
                // Todo, maybe add support for \n newlines? Why would I ?
                //
                i++; // Skip next character
            } else {
                currentArg += char;
            }
        }
    }

    // Add final argument if exists
    if (currentArg) {
        pushVal(currentArg);
    }

    if (currentQuoteChar) {
        // We allow quotes to not be terminated
        // It allows players to do stuff like `:say "wolla my   lovely friend` and not have the text modified or misinterpreted in any way
        // May be good for chat where you dont want every word split into individual arguments
    }

    return args;
}
