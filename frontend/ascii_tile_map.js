import { Vector2i, Orientation } from "./ascii_types.js";
import { AsciiWindow } from "./ascii_window.js";
import { Texture } from "./ascii_textureloader.js";

export class Tile {
    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapChar = " ";

    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapColor = "#fff";

    /** @type {boolean} Should this be rendered as a wall? */
    wall = false;

    /** @type {boolean} is this tile occupied by a sprite? */
    sprite = false;

    /** @type {boolean} Can the player walk here? */
    traversable = true;

    /** @type {boolean} Is this where they player starts? */
    startLocation = false;

    /** @type {boolean} Is this where they player starts? */
    textureId = 0;

    /** @type {Tile} options */
    constructor(options) {
        for (let [k, v] of Object.entries(options)) {
            if (this[k] !== undefined) {
                this[k] = v;
            }
        }
    }

    get collision() {
        return this.wall || this.sprite;
    }
}

export const defaultLegend = Object.freeze({
    //
    // "" is the Unknown Tile - if we encounter a tile that we don't know how to parse,
    // the it will be noted here as the empty string
    "": new Tile({
        minimapChar: " ",
        traversable: true,
        wall: false,
    }),

    //
    // default floor
    " ": new Tile({
        minimapChar: " ",
        traversable: true,
        wall: false,
    }),
    //
    // Default wall
    "#": new Tile({
        minimapChar: "#",
        traversable: false,
        wall: true,
        textureId: 0,
    }),

    "M": new Tile({
        textureId: 1,
        minimapChar: "M",
        minimapColor: "#f00",
        traversable: false,
        wall: false,
        sprite: true,
    }),

    //
    //secret door (looks like wall, but is traversable)
    "Ω": new Tile({
        minimapChar: "#",
        traversable: true,
        wall: true,
    }),
    //
    // where the player starts
    "S": new Tile({
        minimapChar: "S", // "Š",
        traversable: true,
        wall: false,
        startLocation: true,
    }),
});

export class TileMap {
    /**
     * @param {string} str
     * @param {Record<string,Tile} legend
     */
    static fromText(str, legend = defaultLegend) {
        const lines = str.split("\n");

        const longestLine = lines.reduce((acc, line) => Math.max(acc, line.length), 0);

        const tiles = new Array(lines.length).fill().map(() => Array(longestLine));

        lines.forEach((line, y) => {
            line = line.padEnd(longestLine, "#");

            line.split("").forEach((char, x) => {
                let tile = legend[char];

                // unknown char?
                // check fallback tile.
                if (tile === undefined) {
                    tile = legend[""];
                }

                // still no tile - i.e. no back fallback tile?
                if (tile === undefined) {
                    throw new Error("Dont know how to handle this character: " + char);
                }

                // insert tile into map.
                tiles[y][x] = tile;
            });
        });

        return new TileMap(longestLine, lines.length, tiles);
    }

    tileIdx(x, y) {
        return y * this.width + x;
    }

    getByIdx(idx) {
        const y = Math.floor(idx / this.width);
        const x = idx % this.width;
        return this.tiles[y][x];
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {Tile[][]} tiles
     */
    constructor(width, height, tiles) {
        /** @constant @readonly @type {number} */
        this.height = tiles.length;
        /** @constant @readonly @type {number} */
        this.width = tiles[0].length;
        /** @constant @readonly @type {Tile[][]} */
        this.tiles = tiles;
        /** @type {Tile} when probing a coordinate outside the map, this is the tile that is returned */
        this.outOfBoundsWall = this.findFirst({ wall: true });
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

    get(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return this.outOfBoundsWall;
        }

        return this.tiles[y][x];
    }

    isWall(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }

        return this.tiles[y][x].wall;
    }

    findFirst(criteria) {
        return this.forEach((tile, x, y) => {
            for (let k in criteria) {
                if (tile[k] === criteria[k]) {
                    return new Vector2i(x, y);
                }
            }
        });
    }

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

if (Math.PI < 0 && AsciiWindow && Texture && Orientation) {
    ("STFU Linda");
}
