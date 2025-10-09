import parseOptions, { TileOptions } from "../utils/tileOptionsParser.js";
import { Tile, WallTile } from "./ascii_tile_types.js";
import { Vector2i } from "./ascii_types.js";

/**
 * @typedef {object} TileWithCoords
 * @property {Tile} tile
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Map<number,TileWithCoords>} TileCoordsHashTable
 */

/**
 * @callback TileMapForEachCallback
 * @param {Tile} tile
 * @param {number} x
 * @param {number} y
 * @returns {undefined|any} If undefined is returned, the looping continues, but if anything else is returned, the loop halts, and the return value is passed along to the caller
 */

/**
 * @readonly @constant @enum {string}
 */
export const CharType = {
    SYSTEM: "internalMapChar",
    MINIMAP: "minimapChar",
    MINIMAP_REVEALED: "revealedMinimapChar",
};

export class TileMap {
    /**
     * @param {string} str
     * @param {Record<string,Tile} legend
     */
    static fromHumanText(str) {
        str = str.trim();
        const lines = str.split("\n");
        /** @type {Array<Array<Tile>>} */
        const tiles = [];

        let mapWidth;

        lines.forEach((line, y) => {
            // Everything before ":::" is map tiles, and everything after is options for the tiles on that line
            let [tileStr, optionStr] = line.split(/\s*:::\s*/);

            if (y === 0) {
                // Infer the width of the map from the first line
                mapWidth = tileStr.length;
            }

            // Create a new row in the 2d tiles array
            tiles[y] = Array(mapWidth);

            optionStr = optionStr ? optionStr.split(/\s*\/\//)[0] : false;
            const options = optionStr ? parseOptions(optionStr) : [];
            let lineWidth = 0;

            tileStr.split("").forEach((char, x) => {
                //
                // Check if there are options in the queue that matches the current character
                const tileArgs = options[0] && options[0].name === char ? options.shift() : null;

                tiles[y][x] = Tile.fromChar(char, tileArgs, x, y);

                lineWidth++;
            });

            if (lineWidth !== mapWidth) {
                console.error("Invalid line in map", {
                    line: y,
                    expectedWidth: mapWidth,
                    lineWidth,
                });
                throw new Error("Line in map had invalid length");
            }
        });

        return new TileMap(tiles);
    }

    /**
     * @param {Tile[][]} tiles
     */
    constructor(tiles) {
        /** @type {number}      */ this.height = tiles.length;
        /** @type {number}      */ this.width = tiles[0].length;
        /** @type {Tile[][]}    */ this.tiles = tiles;
        /** @type {number}      */ this.playerStartX = undefined;
        /** @type {number}      */ this.playerStartT = undefined;
        /** @type {Tile}        */ this.outOfBoundsWall = this.getReferenceWallTile();
    }

    /**
     * @param {CharType} charType
     * @returns {string}
     */
    toString(charType = CharType.SYSTEM) {
        let result = "";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                result += tile[charType];
            }
            result += "\n";
        }

        return result;
    }

    tileIdx(x, y) {
        return y * this.width + x;
    }

    getByIdx(idx) {
        const y = Math.floor(idx / this.width);
        const x = idx % this.width;
        return this.tiles[y][x];
    }

    get(x, y, outOfBounds = this.outOfBoundsWall) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return outOfBounds;
        }

        return this.tiles[y][x];
    }

    looksLikeWall(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }

        if (!this.tiles[y][x]) {
            x++;
            return true;
        }

        return this.tiles[y][x].looksLikeWall;
    }

    isTraversable(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }

        return this.tiles[y][x].isTraversable;
    }

    /**
     * @param {object} criteria  Search criteria - AND gate
     * @returns {Vector2i|undefined}
     */
    findFirstV(criteria) {
        return this.forEach((tile, x, y) => {
            for (let k in criteria) {
                if (tile[k] === criteria[k]) {
                    return new Vector2i(x, y);
                }
            }
        });
    }

    /**
     * @param {object} criteria  Search criteria - AND gate
     * @returns {Tile|undefined}
     */
    findFirstTile(criteria) {
        const v = this.findFirstV(criteria);
        if (!v) {
            return;
        }

        return this.get(v.x, v.y);
    }

    /**
     * Return the main wall tile.
     *
     * Outer edge of map MUST be wall tiles, so we
     * use tile at [0,0] as the reference wall tile
     *
     * @returns {WallTile}
     */
    getReferenceWallTile() {
        return this.get(0, 0).clone();
    }

    /**
     * Calls `fn(tile, x, y) ` on each element,
     * but _stops_ if fn() returns anything but `undefined`,
     * and then that return value is returned from `forEach`
     *
     * @param {TileMapForEachCallback} fn
     * @returns any|undefined
     */
    forEach(fn) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let res = fn(this.tiles[y][x], x, y);
                if (res !== undefined) {
                    return res;
                }
            }
        }
    }

    /**
     * @returns {number}
     */
    getTraversableTileCount() {
        let sum = 0;

        this.forEach((tile) => {
            if (tile.isTraversable) {
                sum++;
            }
        });

        return sum;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {typeof Tile} tileClass
     * @returns {TileWithCoords[]}
     */
    getCardinalAdjacentTiles(x, y, tileClass) {
        /** @type {TileWithCoords[]} */
        const result = [];

        const testCoords = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y + 1],
        ];

        for (const [_x, _y] of testCoords) {
            const _tile = this.get(_x, _y, false);

            if (_tile === false) {
                // _x, _y was out of bounds, do not add it to result
                continue;
            }

            if (tileClass && !(_tile instanceof tileClass)) {
                // _tile was of invalid type, do not add it to result
                continue;
            }

            result.push({ tile: _tile, x: _x, y: _y });
        }

        return result;
    }

    /**
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     *
     * @returns {TileMap}
     */
    getArea(minX, minY, maxX, maxY) {
        if (minX > maxX) {
            [minX, maxX] = [maxX, minX];
        }
        if (minY > maxY) {
            [minY, maxY] = [maxY, minY];
        }

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        let iX = 0;
        let iY = 0;

        const tiles = new Array(h).fill().map(() => new Array(w));

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = this.tiles[y][x];
                if (!tile) {
                    throw new Error("Dafuqq is happing here?");
                }
                tiles[iY][iX] = tile;
                iX++;
            }
            iX = 0;
            iY++;
        }
        return new TileMap(w, h, tiles);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} manhattanRadius
     */
    getAreaAround(x, y, manhattanRadius) {
        return this.getArea(
            x - manhattanRadius, // minX
            y - manhattanRadius, // minY
            x + manhattanRadius, // maxX
            y + manhattanRadius, // maxY
        );
    }

    /**
     * @param {number} startX
     * @param {number} startY
     * @returns {TileCoordsHashTable}
     */
    getAllTraversableTilesConnectedTo(startX, startY) {
        /** @type {TileCoordsHashTable} */
        const result = new Map();

        const allTilesFlat = new Array(this.width * this.height).fill();

        this.forEach((tile, x, y) => {
            const idx = x + y * this.width;
            allTilesFlat[idx] = { tile, x, y };
        });

        const inspectionStack = [startX + startY * this.width];

        while (inspectionStack.length > 0) {
            const idx = inspectionStack.pop();

            const { tile, x, y } = allTilesFlat[idx];

            if (!tile.isTraversable) {
                continue; // Can't walk there, move on
            }

            if (result.has(idx)) {
                continue; // Already been here, move on
            }

            result.set(idx, allTilesFlat[idx]);

            // Add neighbors
            const [minX, minY] = [1, 1];
            const maxX = this.width - 2;
            const maxY = this.height - 2;

            if (y >= minY) inspectionStack.push(idx - this.width); // up
            if (y <= maxY) inspectionStack.push(idx + this.width); // down
            if (x >= minX) inspectionStack.push(idx - 1); // left
            if (x <= maxX) inspectionStack.push(idx + 1); // right
        }

        return result;
    }
}

if (Math.PI < 0 && TileOptions && WallTile) {
    ("STFU Linda");
}
