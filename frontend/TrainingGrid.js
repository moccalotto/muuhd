import { TrainingCell } from "./TrainingCell.js";

export class TrainingGrid {
    /**
     * @param {TrainingCell[]} cells
     */
    constructor(cells) {
        if (cells[0] === undefined) {
            throw new Error("cells must be a non empty array");
        }

        if (!(cells[0] instanceof TrainingCell)) {
            throw new Error("cells arg must be an array of TrainingCell, but it isn't");
        }

        /** @type {TrainingCell[]} cells*/
        this.cells = cells;

        /** @type {number} the width and/or height of the training grid */
        this.dim = Math.round(Math.sqrt(cells.length));

        if (this.dim ** 2 !== cells.length) {
            throw new Error("Training grid must be quadratic (height === width), but it isn't");
        }
    }

    clone() {
        return new TrainingGrid(this.cells.slice());
    }
}
