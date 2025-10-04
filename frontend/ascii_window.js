export class PseudoPixel {
    /**
     * @param {HTMLElement} htmlElement
     * @param {string} char
     * @param {number|string} color text/foreground color
     */
    constructor(htmlElement, char = " ", color = "#fff") {
        //
        /** @type {HTMLElement} el the html element that makes up this cell*/
        this.htmlElement = htmlElement;

        /** @type {string} char */
        this.char = char;

        /** @type {number|string} fg color color */
        this.color = color;

        /** @type {boolean} Has this pixel's text content been updated since it was flushed to DOM ? */
        this.dirtyChar = true;

        /** @type {boolean} Has this pixel's color been updated since it was flushed to DOM ? */
        this.dirtyColor = true;
    }

    clone() {
        return new PseudoPixel(this.htmlElement, this.car, this.color);
    }
}

export class AsciiWindow {
    /**
     * @param {HTMLElement} htmlElement the html element that contains all the pseudo-pixel elements
     * @param {number} width Canvas width  (in pseudo-pixels)
     * @param {number} height Canvas height (in pseudo-pixels)
     */
    constructor(htmlElement, width, height) {
        //
        /** @type {HTMLElement} the html element that contains all the pseudo-pixels */
        this.htmlElement = htmlElement;

        /** @type {number} width Canvas width  (in pseudo-pixels) */
        this.width = width;

        /** @type {number} height Canvas height (in pseudo-pixels) */
        this.height = height;

        /** @type {PseudoPixel[]} */
        this.pseudoPixels = [];

        this.initializeCanvaas();
    }

    fill(char = " ", color = "#000") {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.put(x, y, char, color);
            }
        }
    }

    /**
     * Create the html elements that make up the canvas,
     * as well as a buffer that holds a copy of the data
     * in the cells so we can diff properly.
     */
    initializeCanvaas() {
        const w = this.width;
        const h = this.height;

        this.pseudoPixels = new Array(w * h).fill();

        let i = 0;
        for (let y = 0; y < h; y++) {
            const rowEl = document.createElement("div");
            this.htmlElement.appendChild(rowEl);

            for (let x = 0; x < w; x++) {
                const pixelEl = document.createElement("code");
                rowEl.appendChild(pixelEl);
                pixelEl.textContent = " ";
                this.pseudoPixels[i] = new PseudoPixel(pixelEl, " ", "#fff");
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

        const pixel = this.pseudoPixels[idx];

        // Check for changes in text contents
        if (char !== undefined && char !== null && char !== pixel.char) {
            pixel.char = char;
            pixel.dirtyChar = true;
        }

        if (color !== undefined && color !== null && color !== pixel.color) {
            pixel.color = color;
            pixel.dirtyColor = true;
        }
    }

    /**
     * Apply all patches to the DOM
     *
     * @return {number} number of DOM updates made
     */
    commitToDOM() {
        this.pseudoPixels.forEach((pixel) => {
            if (pixel.dirtyChar) {
                pixel.htmlElement.textContent = pixel.char;
                pixel.dirtyChar = false;
            }
            if (pixel.dirtyColor) {
                pixel.htmlElement.style.color = pixel.color;
                pixel.dirtyColor = false;
            }
        });
    }
}
