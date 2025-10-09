import { Direction } from "./WfcConstants.js";

/**
 * Represents a 3x3 grid of values (sub-cells), that are used as building blocks for procedurally
 * generated grids. In reality, only the center value will be included in the outputted WfcGrid;
 * the 8 surrounding colors are there to establish which SourceCells can live next to each other.
 */

export class SourceCell {
    /** @param {Uint8Array?} values The 9 sub cells that make up this SourceCell */
    constructor(values) {
        if (values === undefined) {
            this.values = new Uint8Array(9);
            return;
        }
        this.values = values;
    }

    /** @returns {string} The actual value of this Trainin gCell is represented by its center value */
    get value() {
        return this.values[Direction.C];
    }

    /**
     * @param {uint8} value
     * Set the default value of this source cell */
    set value(value) {
        this.values[Direction.C] = value;
    }

    clone() {
        return new SourceCell(this.values.slice());
    }

    /**
     * @param {SourceCell} other
     * @param {number} direction
     *
     * @returns {boolean}
     */
    potentialNeighbours(other, direction) {
        // sadly, we're not allowed to be friends with ourselves.
        if (this === other) {
            console.warn("WTF were checking to be friends with ourselves!", { _this: this, other, direction });
            // throw new Error("WTF were checking to be friends with ourselves!", { _this: this, other, direction });
        }
        return (
            //
            // if they want to live to my east,
            // their two westmost columns must match
            // my two eastmost columns
            (direction == Direction.E &&
                // My center col must match their west col
                this.values[Direction.N] === other.values[Direction.NW] &&
                this.values[Direction.C] === other.values[Direction.W] &&
                this.values[Direction.S] === other.values[Direction.SW] &&
                // My east col must match their center col
                this.values[Direction.NE] === other.values[Direction.N] &&
                this.values[Direction.E] === other.values[Direction.C] &&
                this.values[Direction.SE] === other.values[Direction.S]) ||
            //
            // if they want to live to my west,
            // their two eastmost columns must match
            // my two westmost columns
            (direction == Direction.W &&
                // My center col must match their east col
                this.values[Direction.N] === other.values[Direction.NE] &&
                this.values[Direction.C] === other.values[Direction.E] &&
                this.values[Direction.S] === other.values[Direction.SE] &&
                // My west col must match their center col
                this.values[Direction.NW] === other.values[Direction.N] &&
                this.values[Direction.W] === other.values[Direction.C] &&
                this.values[Direction.SW] === other.values[Direction.S]) ||
            //
            // if they want to live to my north,
            // their two souther rows must match
            // my two northern rows
            (direction == Direction.N &&
                // my middle row must match their south row
                this.values[Direction.W] === other.values[Direction.SW] &&
                this.values[Direction.C] === other.values[Direction.S] &&
                this.values[Direction.E] === other.values[Direction.SE] &&
                // my north row must match their middle row
                this.values[Direction.NW] === other.values[Direction.W] &&
                this.values[Direction.N] === other.values[Direction.C] &&
                this.values[Direction.NE] === other.values[Direction.E]) ||
            //
            // if they want to live to my south,
            // their two northern rows must match
            // my two southern rows
            (direction == Direction.S &&
                // my middle row must match their north row
                this.values[Direction.W] === other.values[Direction.NW] &&
                this.values[Direction.C] === other.values[Direction.N] &&
                this.values[Direction.E] === other.values[Direction.NE] &&
                // my south row must match their middle row
                this.values[Direction.SW] === other.values[Direction.W] &&
                this.values[Direction.S] === other.values[Direction.C] &&
                this.values[Direction.SE] === other.values[Direction.E])
        );
    }
}
