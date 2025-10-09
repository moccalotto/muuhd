import { Direction } from "./WfcConstants.js";
import { WfcCell } from "./WfcCell.js";
import { SourceGrid } from "./SourceGrid.js";
import { Xorshift32 } from "../utils/random.js";

/**
 * A WfcGrid represents the output of a Wave Function Collapse operation.
 */
export class WfcGrid {
    /**
     * @param {number} w width (in cells)
     * @param {number} h height (in cells)
     * @param {SourceGrid} sourceGrid the source grid that will be the source from which we populate this grid.
     * @type {Xorshift32} pre-seeded pseudo random number generator
     */
    constructor(w, h, sourceGrid, rng) {
        /** @type {number} */
        this.width = w;
        /** @type {number} */
        this.height = h;
        /** @type {SourceGrid} */
        this.sourceGrid = sourceGrid;
        /** @type {number[]} */
        this.lowEntropyCellIdCache = sourceGrid.cells.keys;
        /** @type {number} */
        this.lowestEntropy = sourceGrid.dim ** 2;
        /** @type {Xorshift32} */
        this.rng = rng;

        /** @type {WfcCell[]} */
        this.cells = [];

        this.reset();
    }

    reset() {
        const [w, h] = [this.width, this.height];
        const len = w * h;
        this.cells = [];
        for (let i = 0; i < len; i++) {
            const x = i % w;
            const y = Math.floor(i / w);

            this.cells.push(new WfcCell(i, x, y, this.sourceGrid.clone().cells));
        }
    }

    /**
     * Get the cells that currently have the lowest entropy
     */
    refreshLowEntropyCellIdCache() {
        this.lowEntropyCellIdCache = [];

        // set lowestEntropy to the highest possible entropy,
        // and let's search for lower entropy in the cells
        this.lowestEntropy = this.sourceGrid.dim ** 2;

        this.cells.forEach((cell, idx) => {
            const entropy = cell.getEntropy();

            // Cell is locked in, and should not be included
            if (entropy <= 1) {
                return;
            }

            //
            // Have we found cells with low entropy?
            if (entropy < this.lowestEntropy) {
                // we've found a cell with lower entropy that the ones we've been looking
                // at so far Clear the search results and start over with this cell's
                // entropy as our target
                this.lowEntropyCellIdCache = [idx];
                this.lowestEntropy = entropy;
                return;
            }

            //
            // Cell matches current entropy level, add it to search results.
            if (entropy === this.lowestEntropy) {
                // Cell matches our current level of entropy, so we add it to our search results.
                // at so far! Clear the results and start over.
                this.lowEntropyCellIdCache.push(idx);
                return;
            }
        });

        if (this.lowEntropyCellIdCache.length === 0) {
            console.info("Found zero lowest-entropy cells.", { entropy: this.lowestEntropy });
        }
    }

    /**
     * Collapse the grid by one iteration by locking in a random option for the given cell.
     *
     * If no cell given, a random cell will be chosen from the cache of lowest-entropy cells.
     *
     * @param {number?} The index of the cell that is to be collapsed around
     */
    collapse(cellId = undefined) {
        if (this.lowEntropyCellIdCache.length === 0) {
            this.refreshLowEntropyCellIdCache();
        }

        if (cellId === undefined) {
            cellId = this.rng.randomElement(this.lowEntropyCellIdCache);
            if (cellId === undefined) {
                throw new Error("Could not find a valid cell to start the collapse");
            }
        }

        const targetCell = this.cells[cellId];
        if (!targetCell) {
            throw new Error(`Could not find cell with index ${cellId}`);
        }

        /** @type {SourceCell} a randomly chosen option that was available to targetCell */
        const targetOption = this.rng.randomElement(targetCell.options);

        // Lock in the choice for this cell
        targetCell.options = [targetOption];

        //  _____                     ____       _               _
        // | ____|_ __ _ __ ___  _ __| __ )  ___| | _____      _| |
        // |  _| | '__| '__/ _ \| '__|  _ \ / _ \ |/ _ \ \ /\ / / |
        // | |___| |  | | | (_) | |  | |_) |  __/ | (_) \ V  V /|_|
        // |_____|_|  |_|  \___/|_|  |____/ \___|_|\___/ \_/\_/ (_)
        // Locking in this cell has changed the grid.
        // We must look at the cell's cardinal neighbours and update their options.
        for (let nArr of this.neighbourCells(targetCell)) {
            /** @type {number} direction of the neighbour */
            const neighbourDirection = nArr[0];

            /** @type {WfcCell} the neighbouring cell */
            const neighbourCell = nArr[1];

            // Clear the neighbour's options, and
            // repopulate with valid options.
            const newOptions = [];

            for (let neighbourOption of neighbourCell.options) {
                if (neighbourOption.potentialNeighbours(targetOption, neighbourDirection)) {
                    newOptions.push(neighbourOption);
                }
            }

            const newEntropyLevel = newOptions.length;

            // We've collapsed too deep.
            if (newOptions.length === 0) {
                const oldOptions = neighbourCell.options;
                neighbourCell.options = newOptions;
                console.error("We've removed all options from a neighbour!", {
                    targetCell,
                    targetOption,
                    neighbourCell,
                    oldOptions,
                    Direction: Direction[neighbourDirection],
                });
                return false;
            }

            neighbourCell.options = newOptions;

            if (newEntropyLevel < this.lowestEntropy) {
                this.lowestEntropy = newEntropyLevel;
                this.lowEntropyCellIdCache = [];
            }
            if (newEntropyLevel === this.lowestEntropy) {
                if (!this.lowEntropyCellIdCache.includes(neighbourCell.i)) {
                    this.lowEntropyCellIdCache.push(neighbourCell.i);
                }
            }
        }
        return true;
    }

    /**
     * Get the neighbours of a cell.
     * @param {WfcCell} cell
     */
    neighbourCells(cell) {
        const result = [];

        //
        // Northern neighbour
        //
        const yNorth = cell.y - 1;
        if (yNorth > 0) {
            const xNorth = cell.x;
            const idx = this.width * yNorth + xNorth;
            result.push([Direction.N, this.cells[idx]]);
        }

        //
        // Southern neighbour
        //
        const ySouth = cell.y + 1;
        if (ySouth < this.height) {
            const xSouth = cell.x;
            const idx = this.width * ySouth + xSouth;
            result.push([Direction.S, this.cells[idx]]);
        }

        //
        // Eastern neighbour
        //
        const xEast = cell.x + 1;
        if (xEast < this.width) {
            const yEast = cell.y;
            const idx = this.width * yEast + xEast;
            result.push([Direction.E, this.cells[idx]]);
        }

        //
        // Western neighbour
        //
        const xWest = cell.x - 1;
        if (xWest >= 0) {
            const yWest = cell.y;
            const idx = this.width * yWest + xWest;
            result.push([Direction.W, this.cells[idx]]);
        }

        return result;
    }
}
