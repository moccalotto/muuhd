import { Direction } from "./WfcConstants.js";
import { WfcCell } from "./WfcCell.js";

/**
 * A WfcGrid represents the output of a Wave Function Collapse operation.
 */
export class WfcGrid {
    /**
     * @param {number} w width (in cells)
     * @param {number} h height (in cells)
     * @param {TrainingGrid} trainingGrid the training grid that will be the source from which we populate this grid.
     * @type {Xorshift32} pre-seeded pseudo random number generator
     */
    constructor(w, h, trainingGrid, rng) {
        this.width = w;
        this.height = h;
        this.trainingGrid = trainingGrid;
        this.rng = rng;

        //
        // Populate the cells so each has all available options
        // For now, this means *copying* all TrainingCell options into each cell
        this.reset();
    }

    reset() {
        console.log("Resetting Cells");
        const [w, h] = [this.width, this.height];
        const len = w * h;
        this.cells = new Array(len);
        for (let i = 0; i < len; i++) {
            const x = i % w;
            const y = Math.floor(i / w);

            this.cells[i] = new WfcCell(i, x, y, this.trainingGrid.clone().pixels);
        }
        console.log("Done");
    }

    /**
     * Get the cells that currently have the lowest entropy
     * @returns {number[]}
     */
    cellsIdsWithLowestEntropy() {
        console.log("Finding cells with lowest entopy");
        let result = [];

        // set lowestEntropy to the highest possible entropy,
        // and let's search for lower entropy in the cells
        let lowestEntropy = this.trainingGrid.dim ** 2;

        this.cells.forEach((cell, idx) => {
            console.log("\t checking cell %d (entropy: %d)", idx, cell.getEntropy());
            //
            // Have we found cells with low entropy?
            if (cell.getEntropy() < lowestEntropy) {
                // we've found a cell with lower entropy that the ones we've been looking
                // at so far Clear the search results and start over with this cell's
                // entropy as our target
                result = [idx];
                lowestEntropy = cell.getEntropy();
                return;
            }

            //
            // Cell matches current entropy level, add it to search results.
            if (cell.getEntropy() === lowestEntropy) {
                // Cell matches our current level of entropy, so we add it to our search results.
                // at so far! Clear the results and start over.
                result.push(idx);
                return;
            }
        });

        if (result.length <= 0) {
            console.log("Found zero lowest-entropy cells.", { lowestEntropy });
        }

        return result;
    }

    collapse() {
        console.log("Starting collaps()");
        let count = this.cells.length;
        while (count > 0) {
            count--;
            // Get a list of possible target cells
            const lowEntropyCellIds = this.cellIdsWithLowestEntropy();

            //
            // We've hit a dead end
            // No appropriate target cells found.
            if (lowEntropyCellIds.length === 0) {
                console.log("Found no lowest-entropy cells. This should not happen");
                return count;
            }

            const rCellId = this.rng.randomElement(lowEntropyCellIds);
            const rCell = this.cells[rCellId];

            /** @type {TrainingCell} a randomly chosen option that was available to rCell */
            const rOption = this.rng.randomElement(rCell.options);

            // Lock in the choice for this cell
            rCell.options = [rOption];

            //  _____                     ____       _               _
            // | ____|_ __ _ __ ___  _ __| __ )  ___| | _____      _| |
            // |  _| | '__| '__/ _ \| '__|  _ \ / _ \ |/ _ \ \ /\ / / |
            // | |___| |  | | | (_) | |  | |_) |  __/ | (_) \ V  V /|_|
            // |_____|_|  |_|  \___/|_|  |____/ \___|_|\___/ \_/\_/ (_)
            // Locking in this cell has changed the grid.
            // We must look at the cell's cardinal neighbours and update their options.
            for (let nArr of this.getNeighboursFor(rCell)) {
                /** @type {number} direction of the neighbour */
                const neighbourDirection = nArr[0];

                /** @type {WfcCell} the neighbouring cell */
                const neighbourCell = nArr[1];

                // Clear the neighbour's options, and
                // repopulate with valid options.
                const newOptions = [];

                for (let neighbourOption of neighbourCell.options) {
                    if (neighbourOption.potentialNeighbours(rOption, neighbourDirection)) {
                        newOptions.push(neighbourOption);
                    }
                }

                // We've collapsed too deep.
                if (newOptions.length === 0) {
                    console.error("We've removed all options from a neighbour!", {
                        rCell,
                        rOption,
                        neighbourCell,
                        neighbourDirection,
                        newOptions,
                    });
                    return false;
                }

                neighbourCell.options = newOptions;
            }
        }
        console.log("Done");
        return 0;
    }

    /**
     * Get the neighbours of a cell.
     */
    getNeighboursFor(cell) {
        const result = [];

        const yNorth = cell.y - 1;
        if (yNorth >= 0) {
            const xNorth = cell.x;
            const idx = this.width * yNorth + xNorth;
            result.push([Direction.N, this.cells[idx]]);
        }

        const ySouth = cell.y + 1;
        if (ySouth < this.height) {
            const xSouth = cell.x;
            const idx = this.width * ySouth + xSouth;
            result.push([Direction.S, this.cells[idx]]);
        }

        const xEast = cell.x + 1;
        if (xEast < this.width) {
            const yEast = cell.y;
            const idx = this.width * yEast + xEast;
            result.push([Direction.E, this.cells[idx]]);
        }

        const xWest = cell.x - 1;
        if (xWest >= 0) {
            const yWest = cell.y;
            const idx = this.width * yWest + xWest;
            result.push([Direction.W, this.cells[idx]]);
        }

        return result;
    }
}
