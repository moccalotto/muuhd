/**
 * @typedef {object} NormalizedPixel
 * @property {number} r value [0...1]
 * @property {number} g value [0...1]
 * @property {number} b value [0...1]
 * @property {number} a value [0...1]
 *
 * @typedef {object} Pixel
 * @property {number} r value [0...255]
 * @property {number} g value [0...255]
 * @property {number} b value [0...255]
 * @property {number} a value [0...255]
 */

export class NRGBA {
    //
    constructor(r = 0, g = 0, b = 0, a = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    mulRGB(factor) {
        this.r *= factor;
        this.g *= factor;
        this.b *= factor;
    }

    get dR() {
        return ((this.r * 255) | 0) % 256;
    }
    get dG() {
        return ((this.g * 255) | 0) % 256;
    }
    get dB() {
        return ((this.b * 255) | 0) % 256;
    }
    get dA() {
        return ((this.a * 255) | 0) % 256;
    }

    toCSS() {
        return (
            "#" + // prefix
            this.dR.toString(16).padStart(2, "0") +
            this.dG.toString(16).padStart(2, "0") +
            this.dB.toString(16).padStart(2, "0") +
            this.dA.toString(16).padStart(2, "0")
        );
    }
}

/**
 * Texture class,
 * represents a single texture
 */
export class Texture {
    static async fromSource(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = img.width;
                    canvas.height = img.height;

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);

                    const result = new Texture(img.width, img.height, imageData.data);

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error(`Failed to load texture: ${src}`));
            img.src = src;
        });
    }
    constructor(width, height, data) {
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
        /** @type {Uint8ClampedArray} */
        this.data = data;
    }

    /**
     * Bilinear sampling for smooth texture filtering
     *
     * @param {number} u the "x" coordinate of the texture sample pixel. Normalized to [0...1]
     * @param {number} w the "y" coordinate of the texture sample pixel. Normalized to [0...1]
     *
     * @returns {NRGBA}
     */
    sample(u, v) {
        const x = Math.round(u * this.width);
        const y = Math.round(v * this.height);
        const index = (y * this.width + x) * 4;
        return new NRGBA(
            this.data[index + 0] / 255,
            this.data[index + 1] / 255,
            this.data[index + 2] / 255,
            1, // this.data[index + 3] / 255,
        );
    }
}
