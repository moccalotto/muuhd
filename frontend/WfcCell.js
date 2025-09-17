import { TrainingCell } from "./TrainingCell";

/**
 * Represents a single cell in a WfcGrid
 */
export class WfcCell {
    /**
     * @constructor
     * @param {number} i index in the cell-array of this cell
     * @param {number} x x-coordinate of cell
     * @param {number} y y-coordinate of cell
     * @param {TrainingCell[]} options - A list of training cells that could potentially live here.
     */
    constructor(i, x, y, options) {
        if (!options.length) {
            console.log("Bad >>options<< arg in WfcCell constructor. Must not be empty.", options);
            throw Error("Bad >>options<< arg in WfcCell constructor. Must not be empty.", options);
        }

        if (!(options[0] instanceof TrainingCell)) {
            console.log("Bad >>options<< arg in WfcCell constructor. Must be array of WfcCells, but wasn't.", options);
            throw Error("Bad >>options<< arg in WfcCell constructor. Must be array of WfcCells, but wasn't.", options);
        }

        this.i = i;
        this.x = x;
        this.y = y;
        this.options = options;
    }

    getEntropy() {
        const result = this.options.length;
        return result;
    }

    get lockedIn() {
        return this.getEntropy() === 1;
    }

    get valid() {
        return this.options.length > 0;
    }

    get value() {
        if (this.options[0] === undefined) {
            throw new Error("Bad! I do not have any options, and therefore no color");
        }
        return this.options[0].value;
    }
}
