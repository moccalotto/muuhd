import parseOptions, { ParsedCall } from "../utils/callParser.js";
import { Tile } from "./ascii_tile_types.js";
import { Vector2i } from "./ascii_types.js";

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
                console.log({ mapWidth });
            }

            // Create a new row in the 2d tiles array
            tiles[y] = Array(mapWidth);

            optionStr = optionStr ? optionStr.split(/\s*\/\//)[0] : false;
            const options = optionStr ? parseOptions(optionStr) : [];
            let lineWidth = 0;

            options.length && console.log({ options, y });

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
     * @param {Map<Tile,ParsedCall>} options
     */
    constructor(tiles) {
        /** @constant @readonly @type {number} */
        this.height = tiles.length;
        /** @constant @readonly @type {number} */
        this.width = tiles[0].length;
        /** @constant @readonly @type {Tile[][]} */
        this.tiles = tiles;

        /** @type {Tile} when probing a coordinate outside the map, this is the tile that is returned */
        this.outOfBoundsWall = this.findFirstV({ looksLikeWall: true });
    }

    toString() {
        let result = "";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                result += tile.minimapChar;
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

    get(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return this.outOfBoundsWall;
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
     * @param { (tile, x,y) => any|undefined ) } fn
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

    getArea(xMin, yMin, xMax, yMax) {
        if (xMin > xMax) {
            [xMin, xMax] = [xMax, xMin];
        }
        if (yMin > yMax) {
            [yMin, yMax] = [yMax, yMin];
        }

        const w = xMax - xMin + 1;
        const h = yMax - yMin + 1;
        let iX = 0;
        let iY = 0;

        const tiles = new Array(h).fill().map(() => new Array(w));

        for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
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

    getAreaAround(x, y, radius) {
        return this.getArea(x - radius, y - radius, x + radius, y + radius);
    }
}

if (Math.PI < 0 && ParsedCall) {
    ("STFU Linda");
}
