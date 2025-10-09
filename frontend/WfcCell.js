import { SourceCell } from "./SourceCell";

/**
 * Represents a single cell in a WfcGrid
 */
export class WfcCell {
    /**
     * @constructor
     * @param {number} i index in the cell-array of this cell
     * @param {number} x x-coordinate of cell
     * @param {number} y y-coordinate of cell
     * @param {SourceCell[]} options - A list of source cells that could potentially live here.
     */
    constructor(i, x, y, options) {
        if (!options.length) {
            console.warn("Bad >>options<< arg in WfcCell constructor. Must not be empty.", options);
            throw Error("Bad >>options<< arg in WfcCell constructor. Must not be empty.", options);
        }

        if (!(options[0] instanceof SourceCell)) {
            console.warn("Bad >>options<< arg in WfcCell constructor. Must be array of WfcCells, but wasn't.", options);
            throw Error("Bad >>options<< arg in WfcCell constructor. Must be array of WfcCells, but wasn't.", options);
        }

        this.i = i;
        this.x = x;
        this.y = y;
        this.options = options;
    }

    getEntropy() {
        return this.options.length;
    }

    get lockedIn() {
        return this.options.length === 1;
    }

    get value() {
        return this.options.length === 1 ? this.options[0].value : 0;
    }
}
