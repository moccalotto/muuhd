/**
 * @readonly
 *
 * @enum {string}
 */
export const FrameType = {

    /**
     * ╔════════════╗
     * ║ Hello, TUI ║
     * ╚════════════╝
     *
     * @type {string} Double-lined frame
     */
    Double: "Double",

    /**
     * ┌────────────┐
     * │ Hello, TUI │
     * └────────────┘
     *
     * @type {string} Single-lined frame
     */
    Single: "Single",


    /**
     *
     *   Hello, TUI
     *
     *
     * @type {string} Double-lined frame
     */
    Invisible: "Invisible",


    /**
     * (            )
     * ( Hello, TUI )
     * (            )
     *
     * @type {string} Double-lined frame
     */
    Parentheses: "Parentheses",

    /**
     * +------------+
     * | Hello, TUI |
     * +------------+
     *
     * @type {string} Double-lined frame
     */
    Basic: "Basic",


    /**
     * @protected
     * Default values for the common frame types.
     *
     * [north, south, east, west, northwest, northeast, southwest, southeast]
     */
    values: {
        Basic: "--||++++",
        Double: "══║║╔╗╚╝",
        Invisible: "        ",
        Parentheses: "  ()    ",
        Single: "──││┌┐└┘",
    }
}

export class FramingOptions {
    /** @type {number=0} Vertical Padding; number of vertical whitespace (newlines) between the text and the frame. */
    vPadding = 0;

    /** @type {number=0} Margin ; number of newlines to to insert before and after the framed text */
    vMargin = 0;

    /** @type {number=0} Horizontal Padding; number of whitespace characters to insert between the text and the sides of the frame. */
    hPadding = 0;

    /** @type {number=0} Margin ; number of newlines to to insert before and after the text, but inside the frame */
    hMargin = 0;

    /** @type {FrameType=FrameType.Double} Type of frame to put around the text */
    frameType = FrameType.Double;

    /** @type {number=0} Pad each line to become at least this long */
    minLineWidth = 0;

    // Light block: ░ (U+2591)
    // Medium block: ▒ (U+2592)
    // Dark block: ▓ (U+2593)
    // Solid block: █ (U+2588)
    /** @type {string} Single character to use as filler inside the frame. */
    paddingChar = " "; // character used for padding inside the frame.

    /** @type {string} Single character to use as filler outside the frame. */
    marginChar = " ";

    /** @type {string} The 8 characters that make up the frame elements */
    frameChars = FrameType.values.Double;

    /**
     * @param {object} o
     * @returns {FramingOptions}
     */
    static fromObject(o) {
        const result = new FramingOptions();

        result.vPadding = Math.max(0, Number.parseInt(o.vPadding) || 0);
        result.hPadding = Math.max(0, Number.parseInt(o.hPadding) || 0);
        result.vMargin = Math.max(0, Number.parseInt(o.vMargin) || 0);
        result.hMargin = Math.max(0, Number.parseInt(o.hMargin) || 0);
        result.minLineWidth = Math.max(0, Number.parseInt(o.hMargin) || 0);

        result.paddingChar = String(o.paddingChar || " ")[0] || " ";
        result.marginChar = String(o.marginChar || " ")[0] || " ";

        //
        // Do we have custom and valid frame chars?
        if (typeof o.frameChars === "string" && o.frameChars.length === FrameType.values.Double.length) {
            result.frameChars = o.frameChars;

            //
            // do we have document frame type instead ?
        } else if (o.frameType && FrameType.hasOwnProperty(o.frameType)) {
            result.frameChars = FrameType.values[o.frameType];

            // Fall back to using "Double" frame
        } else {
            result.frameChars = FrameType.values.Double;
        }


        return result;
    }
}

/**
 * @param {string|string[]} text the text to be framed. If array, each element will be treated as one line, and they are joined so the whole is to be framed.
 * @param {FramingOptions} options
 */
export function frameText(text, options) {

    if (!options) {
        options = new FramingOptions();
    }

    if (!(options instanceof FramingOptions)) {
        options = FramingOptions.fromObject(options);
    }

    // There is a point to this; each element in the array may contain newlines,
    // so we have to combine everything into a long text and then split into
    // individual lines afterwards.
    if (Array.isArray(text)) {
        text = text.join("\n");
    }

    if (typeof text !== "string") {
        console.debug(text);
        throw new Error(`text argument was neither an array or a string, it was a  ${typeof text}`);
    }

    /** @type {string[]} */
    const lines = text.split("\n");

    const innerLineLength = Math.max(
        lines.reduce((accumulator, currentLine) => {
            if (currentLine.length > accumulator) {
                return currentLine.length;
            }
            return accumulator;
        }, 0), options.minLineWidth);

    const frameThickness = 1; // always 1 for now.

    const outerLineLength = 0
        + innerLineLength
        + frameThickness * 2
        + options.hPadding * 2
        + options.hMargin * 2;

    // get the frame characters from the frameType.
    let [
        fNorth,             // horizontal frame top lines
        fSouth,             // horizontal frame bottom lines
        fWest,              // vertical frame lines on the left side
        fEast,              // vertical frame lines on the right side
        fNorthWest,         // upper left frame corner
        fNorthEast,         // upper right frame corner
        fSouthWest,         // lower left frame corner
        fSouthEast,         // lower right frame corner
    ] = options.frameChars.split("");
    if (fNorth === "§") { fNorth  = ""; }
    if (fSouth === "§") { fSouth  = ""; }
    if (fEast === "§") { fEast  = ""; }
    if (fWest === "§") { fWest  = ""; }
    if (fNorthEast === "§") { fNorthEast  = ""; }
    if (fSouthEast === "§") { fSouthEast  = ""; }
    if (fNorthWest === "§") { fNorthWest  = ""; }
    if (fSouthWest === "§") { fSouthWest  = ""; }

    let output = "";

    //
    // GENERATE THE MARGIN SPACE ABOVE THE FRAMED TEXT
    //
    //  ( we insert space characters even though  )
    //  ( they wouldn't normally be visible. But  )
    //  ( Some fonts might allow us to see blank  )
    //  ( space, and what if we want to nest many )
    //  ( frames inside each other?               )
    //
    output += (options.marginChar.repeat(outerLineLength) + "\n").repeat(options.vMargin);


    //
    // GENERATE THE TOP PART OF THE FRAME
    //      ╔════════════╗
    //
    //
    output += "" // Make sure JS knows we're adding a string.
        + options.marginChar.repeat(options.hMargin)               // the margin before the frame starts
        + fNorthWest                                               // northwest frame corner
        + fNorth.repeat(innerLineLength + options.hPadding * 2)  // the long horizontal frame top bar
        + fNorthEast                                               // northeast frame corner
        + options.marginChar.repeat(options.hMargin)               // the margin after the frame ends
        + "\n";
    //
    // GENERATE UPPER PADDING
    //
    //    ║           ║
    //
    //  (the blank lines within the frame and above the text)
    output += (
        options.marginChar.repeat(options.hMargin)
        + fWest
        + options.paddingChar.repeat(innerLineLength + options.hPadding * 2)
        + fEast
        + options.marginChar.repeat(options.hMargin)
        + "\n"
    ).repeat(options.vPadding);

    //
    // GENERATE FRAMED TEXT SEGMENT
    //
    //    ║ My pretty ║
    //    ║ text here ║
    //
    // ( this could be done with a reduce() )
    //
    for (const line of lines) {
        output += "" // Make sure JS knows we're adding a string.
            + options.marginChar.repeat(options.hMargin)     // margin before frame
            + fWest                                          // vertical frame char
            + options.paddingChar.repeat(options.hPadding)   // padding before text
            + line.padEnd(innerLineLength, " ")              // The actual text. Pad it with normal space character, NOT custom space.
            + options.paddingChar.repeat(options.hPadding)   // padding after text
            + fEast                                          // vertical frame bar
            + options.marginChar.repeat(options.hMargin)     // margin after frame
            + "\n";
    }

    //
    // GENERATE LOWER PADDING
    //
    //    ║           ║
    //
    //  ( the blank lines within the )
    //  ( frame and below the text   )
    //
    //  ( this code is a direct      )
    //  ( repeat of the code that    )
    //  ( generates top padding      )
    output += (
        options.marginChar.repeat(options.hMargin)
        + fWest
        + options.paddingChar.repeat(innerLineLength + options.hPadding * 2)
        + fEast
        + options.marginChar.repeat(options.hMargin)
        + "\n"
    ).repeat(options.vPadding);


    //
    // GENERATE THE BOTTOM PART OF THE FRAME
    //
    //      ╚════════════╝
    //
    output += "" // Make sure JS knows we're adding a string.
        + options.marginChar.repeat(options.hMargin)               // the margin before the frame starts
        + fSouthWest                                               // northwest frame corner
        + fSouth.repeat(innerLineLength + options.hPadding * 2)  // the long horizontal frame top bar
        + fSouthEast                                               // northeast frame corner
        + options.marginChar.repeat(options.hMargin)               // the margin after the frame starts
        + "\n";

    //
    // GENERATE THE MARGIN SPACE BELOW THE FRAMED TEXT
    //
    //  ( we insert space characters even though  )
    //  ( they wouldn't normally be visible. But  )
    //  ( Some fonts might allow us to see blank  )
    //  ( space, and what if we want to nest many )
    //  ( frames inside each other?               )
    //
    output += (options.marginChar.repeat(outerLineLength) + "\n").repeat(options.vMargin);

    return output;
}

// Allow this script to be run directly from node as well as being included!
// https://stackoverflow.com/a/66309132/5622463
