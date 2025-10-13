/**
 * Pseudo random number generator
 * using the xorshift32 method.
 */
export class Xorshift32 {
    /* @type {number} */
    initialSeed;

    /**
     * State holds a single uint32.
     * It's useful for staying within modulo 2**32.
     *
     * @type {Uint32Array}
     */
    state;

    /** @param {number} seed */
    constructor(seed) {
        if (seed === undefined) {
            const maxInt32 = 2 ** 32;
            seed = Math.floor(Math.random() * (maxInt32 - 1)) + 1;
        }
        seed = seed | 0;
        this.state = Uint32Array.of(seed);
    }

    /** @protected Shuffle the internal state. */
    shuffle() {
        this.state[0] ^= this.state[0] << 13;
        this.state[0] ^= this.state[0] >>> 17;
        this.state[0] ^= this.state[0] << 5;

        // We could also do something like this:
        // x ^= x << 13;
        // x ^= x >> 17;
        // x ^= x << 5;
        // return x;
        // But we'd have to xor the x with 2^32 after every op,
        // we get that "for free" by using the uint32array
    }

    /**
     * Get a random number and shuffle the internal state.
     * @returns {number} a pseudo-random positive integer.
     */
    get() {
        this.shuffle();
        return this.state[0];
    }

    /** @param {number} x @returns {number} a positive integer lower than x */
    lowerThan(x) {
        return this.get() % x;
    }

    /** @param {number} x @returns {number} a positive integer lower than or equal to x */
    lowerThanOrEqual(x) {
        return this.get() % (x + 1);
    }

    /**
     * @template T
     * @param {T[]} arr - The array to pick from.
     * @returns {T} One element from the array.   * @return {<T>}
     */
    randomElement(arr) {
        if (arr instanceof Set) {
            arr = [...arr];
        }
        const idx = this.lowerThan(arr.length);

        return arr[idx];
    }

    /**
     * @param {...<T>} ... pick random function argument
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
