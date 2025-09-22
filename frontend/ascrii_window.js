const grayscale = [
    "#000",
    "#111",
    "#222",
    "#333",
    "#444",
    "#555",
    "#666",
    "#777",
    "#888",
    "#999",
    "#aaa",
    "#bbb",
    "#ccc",
    "#ddd",
    "#eee",
    "#fff",
];

function normalizeColor(color) {
    if (typeof color === "number" && color >= 0 && color <= 1) {
        return grayscale[Math.round(color * 16)];
    }

    if (typeof color === "number" && color >= 0 && color <= 16) {
        return grayscale[color];
    }

    if (typeof color === "string" && color.length === 4 && color[0] === "#") {
        return color;
    }

    throw new Error("Color could not be normalized");
}

class Patch {
    /** @type {string} char */
    char;

    /** @type {number|string} fg foreground color */
    bg;

    /** @type {number|string} bg background color */
    fg;

    /** @param {HTMLElement} el */
    constructor(el) {
        /** @type {HTMLElement} el */
        this.el = el;
    }
}

export class Pixel {
    /**
     * @param {HTMLElement} el
     * @param {string} char
     * @param {number|string} fg foreground color
     * @param {number|string} bg background color
     */
    constructor(el, char = " ", fg = "#fff", bg = undefined) {
        //
        /** @type {HTMLElement} el the html element that makes up this cell*/
        this.el = el;

        /** @type {string} char */
        this.char = char;

        /** @type {number|string} bg background color */
        this.fg = fg === undefined ? undefined : normalizeColor(fg);

        /** @type {number|string} fg foreground color */
        this.bg = bg === undefined ? undefined : normalizeColor(bg);
    }

    clone() {
        return new Pixel(this.el, this.car, this.fg, this.bg);
    }
}

export class AsciiWindow {
    /**
     * @param {HTMLElement} container
     * @param {number} width Canvas width  (in pseudo-pixels)
     * @param {number} height Canvas height (in pseudo-pixels)
     */
    constructor(container, width, height) {
        //
        /** @type {HTMLElement} Paren element that contains all the pseudo-pixels */
        this.container = container;

        /** @type {number} width Canvas width  (in pseudo-pixels) */
        this.width = width;

        /** @type {number} height Canvas height (in pseudo-pixels) */
        this.height = height;

        /** @type {Pixel[][]} */
        this.canvas = undefined;

        /** @type {Patch[]} */
        this.diff = [];

        this.initializeCanvaas();
    }

    /**
     * Create the html elements that make up the canvas,
     * as well as a buffer that holds a copy of the data
     * in the cells so we can diff properly.
     */
    initializeCanvaas() {
        const w = this.width;
        const h = this.height;

        /** @type {Pixel[][]} */
        this.canvas = new Array(w).fill().map(() => new Array(h).fill().map(() => new Pixel()));

        for (let y = 0; y < h; y++) {
            const rowEl = document.createElement("div");
            this.container.appendChild(rowEl);

            for (let x = 0; x < w; x++) {
                const pixelEl = document.createElement("code");
                rowEl.appendChild(pixelEl);
                pixelEl.textContent = " ";
                this.canvas[y][x] = new Pixel(pixelEl, " ");
            }
        }
    }

    withinBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    mustBeWithinBounds(x, y) {
        if (!this.withinBounds(x, y)) {
            throw new Error(`Coordinate [${x}, ${y}] is out of bounds`);
        }
    }

    put(x, y, char, fg = undefined, bg = undefined) {
        //
        this.mustBeWithinBounds(x, y);
        const pixel = this.canvas[y][x];

        const patch = new Patch(pixel.el);

        fg = fg === undefined ? undefined : normalizeColor(fg);
        bg = bg === undefined ? undefined : normalizeColor(bg);

        let changeCount = 0;

        // Check for changes in text contents
        if (char !== undefined && char !== pixel.char) {
            changeCount++;
            patch.char = char;
            pixel.char = char;
        }

        // Check for changes in foreground color
        if (fg !== undefined && fg !== pixel.fg) {
            changeCount++;
            patch.fg = fg;
            pixel.fg = fg;
        }

        // Check for changes in background color
        if (bg !== undefined && bg !== pixel.bg) {
            changeCount++;
            patch.bg = bg;
            pixel.bg = bg;
        }

        if (changeCount > 0) {
            this.diff.push(patch);
        }
    }

    /**
     * Apply all patches to the DOM
     */
    commitToDOM() {
        this.diff.forEach((/** @type {Patch} */ patch) => {
            if (patch.char !== undefined) {
                patch.el.textContent = patch.char;
            }
            if (patch.fg !== undefined) {
                patch.el.style.color = patch.fg;
            }
            if (patch.bg !== undefined) {
                patch.el.style.backgroundColor = patch.bg;
            }
        });
        this.diff = [];
    }
}
