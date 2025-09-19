import { SourceCell } from "./SourceCell.js";

export class SourceGrid {
    /**
     * @type {SourceCell[]} cells The cells that make up this source grid.
     */
    cells;

    /**
     * @type {number} the width and/or height of the source grid
     */
    dim;

    /**
     * @param {SourceCell[]} cells
     */
    constructor(cells) {
        if (cells[0] === undefined) {
            throw new Error("cells must be a non empty array");
        }

        if (!(cells[0] instanceof SourceCell)) {
            throw new Error("cells arg must be an array of SourceCell, but it isn't");
        }

        this.cells = cells;

        this.dim = Math.round(Math.sqrt(cells.length));

        if (this.dim ** 2 !== cells.length) {
            throw new Error("Source grid must be quadratic (height === width), but it isn't");
        }
    }

    toString() {
        return this.cells.map((cell) => cell.value).join(", ");
    }

    clone() {
        return new SourceGrid(this.cells.map((sgCell) => sgCell.clone()));
    }
}
