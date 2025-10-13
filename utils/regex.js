/**
 * Makes it easier to document regexes because you can break them up
 *
 * @param {...string} args
 * @returns {Regexp}
 */
export function pretty(...args) {
    const regexprStr = args.join("");
    return new RegExp(regexprStr);
}
