const NW = 0;
const N = 1;
const NE = 2;
const E = 3;
const C = 4;
const W = 5;
const SW = 6;
const S = 7;
const SE = 8;

export class TrainingImage {
    /** @param {number} w Width (in pixels) of the training image */
    /** @param {number} h Height (in pixels) of the training image */
    /** @param {Array<TrainingPixel>} pixels
     *
     */
    constructor(w, h, pixels) {
        this.pixels = pixels;

        this.w = w;

        this.h = h;
    }

    establishFriendships() {
        //
        // This can be optimized a helluvalot much
        this.pixels.forEach((pix1) => {
            this.pixels.forEach((pix2) => {
                pix1.addFriend(pix2);
            });
        });
    }
}

/**
 * Represents a 3x3 grid of trianing-pixels, that are used as building blocks for procedurally generated
 * images. In reality, only the center color will be included in the output image. The 8 surrounding
 * colors are there to establish restrictions/options for the WFC algorithm.
 */
export class TrainingPixel {
    /** @type {string[9]} The 9 sub pixels that make up this TrainingPixel */
    subPixels;

    /** @type {TrainingPixel[]} The other TrainingPixels that we can share eastern borders with */
    friendsEast = new Set();

    /** @type {TrainingPixel[]} The other TrainingPixels that we can share western borders with */
    friendsWest = new Set();

    /** @type {TrainingPixel[]} The other TrainingPixels that we can share northern borders with */
    friendsNorth = new Set();

    /** @type {TrainingPixel[]} The other TrainingPixels that we can share southern borders with */
    friendsSouth = new Set();

    /** @type {TrainingPixel[]} Superset of all the friends this TrainingPixel has */
    friendsTotal = new Set();

    constructor(subPixels) {
        this.subPixels = subPixels;
    }

    /**
     * @param {TrainingPixel} other
     *
     * @returns {N,S,E,W,false}
     */
    addFriend(other) {
        // sadly, we're not allowed to be friends with ourselves.
        if (this === other) {
            return false;
        }

        // Check if other can be placed to the east of me
        if (
            // My center col must match their west col
            this.subPixels[N] === other.subPixels[NW] &&
            this.subPixels[C] === other.subPixels[W] &&
            this.subPixels[S] === other.subPixels[SW] &&
            // My east col must match their center col
            this.subPixels[NE] === other.subPixels[N] &&
            this.subPixels[E] === other.subPixels[C] &&
            this.subPixels[SE] === other.subPixels[S]
        ) {
            this.friendsEast.add(other);
            other.friendsWest.add(this);
        }

        // check if other can be placed west of me
        if (
            // My center col must match their east col
            this.subPixels[N] === other.subPixels[NE] &&
            this.subPixels[C] === other.subPixels[E] &&
            this.subPixels[S] === other.subPixels[SE] &&
            // My west col must match their center col
            this.subPixels[NW] === other.subPixels[N] &&
            this.subPixels[W] === other.subPixels[C] &&
            this.subPixels[SW] === other.subPixels[S]
        ) {
            this.friendsWest.add(other);
            other.friendsEast.add(this);
        }

        // check if other can be placed to my north
        if (
            // my middle row must match their south row
            this.subPixels[W] === other.subPixels[SW] &&
            this.subPixels[C] === other.subPixels[S] &&
            this.subPixels[E] === other.subPixels[SE] &&
            // my north row must match their middle row
            this.subPixels[NW] === other.subPixels[W] &&
            this.subPixels[NC] === other.subPixels[C] &&
            this.subPixels[NE] === other.subPixels[E]
        ) {
            this.friendsNorth.add(other);
            other.friendsSouth.add(this);
        }

        // check if other can be placed to my south
        if (
            // my middle row must match their north row
            this.subPixels[W] === other.subPixels[NW] &&
            this.subPixels[C] === other.subPixels[N] &&
            this.subPixels[E] === other.subPixels[SE] &&
            // my south row must match their middle row
            this.subPixels[SW] === other.subPixels[W] &&
            this.subPixels[SC] === other.subPixels[c] &&
            this.subPixels[SE] === other.subPixels[E]
        ) {
            this.friendsSouth.add(other);
            other.friendsNorth.add(this);
        }

        return false;
    }
}
