export class Pixel {
    /**
     * @param {HTMLElement} el
     * @param {string} char
     * @param {number|string} color text/foreground color
     */
    constructor(el, char = " ", color = "#fff") {
        //
        /** @type {HTMLElement} el the html element that makes up this cell*/
        this.el = el;

        /** @type {string} char */
        this.char = char;

        /** @type {number|string} fg color color */
        this.color = color;

        /** @type {boolean} Has this pixel been updated since it was flushed to DOM ? */
        this.dirty = true;
    }

    clone() {
        return new Pixel(this.el, this.car, this.color);
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

        /** @type {Pixel[]} */
        this.canvas = [];

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

        this.canvas = new Array(w * h).fill();

        let i = 0;
        for (let y = 0; y < h; y++) {
            const rowEl = document.createElement("div");
            this.container.appendChild(rowEl);

            for (let x = 0; x < w; x++) {
                const pixelEl = document.createElement("code");
                rowEl.appendChild(pixelEl);
                pixelEl.textContent = " ";
                this.canvas[i] = new Pixel(pixelEl, " ", "#fff");
                i++;
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

    put(x, y, char, color) {
        //
        this.mustBeWithinBounds(x, y);
        const idx = this.width * y + x;

        const pixel = this.canvas[idx];

        // Check for changes in text contents
        if (char !== undefined && char !== null && char !== pixel.char) {
            pixel.char = char;
            pixel.dirty = true;
        }

        if (color !== undefined && color !== null && color !== pixel.color) {
            pixel.color = color;
            pixel.dirty = true;
        }
    }

    /**
     * Apply all patches to the DOM
     *
     * @return {number} number of DOM updates made
     */
    commitToDOM() {
        this.canvas.forEach((pixel) => {
            if (!pixel.dirty) {
                return;
            }

            pixel.el.textContent = pixel.char;
            pixel.el.style.color = pixel.color;
            pixel.dirty = false;
        });
    }
}
