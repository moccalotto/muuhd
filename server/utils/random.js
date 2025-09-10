/**
 * Pseudo random number generator
 * using the xorshift32 method.
 */
export class Xorshift32 {
    /* @type {number} */
    state;

    /** @param {number} seed */
    constructor(seed) {
        this.state = seed | 0;
    }

    /** @protected Shuffle the internal state. */
    shuffle() {
        //
        // Run the actual xorshift32 algorithm
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        x = (x >>> 0) / 4294967296;

        this.state = x;
    }

    /**
     * Get a random number and shuffle the internal state.
     * @returns {number} a pseudo-random positive integer.
     */
    get() {
        this.shuffle();
        return this.state;
    }

    /** @param {number} x @returns {number} a positive integer lower than x */
    lowerThan(x) {
        return this.get() % x;
    }

    /** @param {number} x @reurns {number} a positive integer lower than or equal to x */
    lowerThanOrEqual(x) {
        return this.get() % (x + 1);
    }

    /**
     * @param {<T>[]} arr
     *
     * @return {<T>}
     */
    randomElement(arr) {
        const idx = this.lowerThan(arr.length);

        return arr[idx];
    }

    /**
     * @param {...<T>} args
     * @returns {<T>}
     */
    oneOf(...args) {
        const idx = this.lowerThan(args.length);

        return args[idx];
    }

    /**
     * @param {number} lowerThanOrEqual a positive integer
     * @param {number} greaterThanOrEqual a positive integer greater than lowerThanOrEqual
     * @returns {number} a pseudo-random integer
     */
    within(greaterThanOrEqual, lowerThanOrEqual) {
        const range = lowerThanOrEqual - greaterThanOrEqual;

        const num = this.lowerThanOrEqual(range);

        return num + greaterThanOrEqual;
    }
}

