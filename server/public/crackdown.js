//   ____                _    ____
//  / ___|_ __ __ _  ___| | _|  _ \  _____      ___ __
// | |   | '__/ _` |/ __| |/ / | | |/ _ \ \ /\ / / '_ \
// | |___| | | (_| | (__|   <| |_| | (_) \ V  V /| | | |
//  \____|_|  \__,_|\___|_|\_\____/ \___/ \_/\_/ |_| |_|
//
//
//  _ __   __ _ _ __ ___  ___ _ __
// | '_ \ / _` | '__/ __|/ _ \ '__|
// | |_) | (_| | |  \__ \  __/ |
// | .__/ \__,_|_|  |___/\___|_|
// |_|

const capture = "([a-zA-Z0-9:()-](?:.*[a-zA-Z0-9:()-])?)";
const skipSpace = "\\s*";

const htmlEscapeRegex = /[&<>"'`]/g; // used to escape html characters

/**
 * @type {Array.string[]}
 *
 * The order of the elements of this array matters.
 */
const opcodes = [
    ["(^|\\n)=", "($|\\n)", "$1<h1>$2</h1>$3"],
    ["(^|\\n)==", "($|\\n)", "$1<h2>$2</h2>$3"],
    ["---", "---", "<span class='strike'>$1</span>"],
    ["___", "___", "<span class='underline'>$1</span>"],
    ["(?:[.]{3})", "(?:[.]{3})", "<span class='undercurl'>$1</span>"],
    ["(?:[(]{2})", "(?:[)]{2})", "<span class='faint'>$1</span>"],
    ["_", "_", "<span class='italic'>$1</span>"],
    ["\\*", "\\*", "<span class='bold'>$1</span>"],
    ["\\[\\[([a-zA-Z0-9_ ]+)\\[\\[", "\\]\\]", "<span class='$1'>$2</span>"],
];
/** @type{Array.Array.<Regexp,string>} */
const regexes = [];

for (const [left, right, replacement] of opcodes) {
    regexes.push([new RegExp(left + skipSpace + capture + skipSpace + right, "g"), replacement]);
}

/** @param {string} text */
export function crackdown(text) {
    text.replace(htmlEscapeRegex, (c) => {
        switch (c) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#039;";
            case "`":
                return "&#096;";
            default:
                return c;
        }
    });
    for (const k in regexes) {
        const [regex, replacement] = regexes[k];
        text = text.replace(regex, replacement);
    }

    console.debug("crack output", text);

    return text;
}
