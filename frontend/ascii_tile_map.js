import { FunctionCallParser } from "../utils/callParser.js";
import { Vector2i, Orientation } from "./ascii_types.js";
import { AsciiWindow } from "./ascii_window.js";

export class TileMap {
    /**
     * @param {string} str
     * @param {Record<string,Tile} legend
     */
    static fromText(str) {
        const lines = str.split("\n");
        const tiles = [];
        const options = [];
        const optionsParser = new FunctionCallParser();

        let mapWidth;

        lines.forEach((line, y) => {
            tiles[y] = [];
            options[y] = [];

            // Everything before ":::" is map tiles, and everything after is options for the tiles on that line
            let [tileStr, optionStr] = line.split(/\s*:::\s*/);

            // Infer the width of the map from the first line
            if (!mapWidth) {
                mapWidth = tileStr.length;
            }

            optionStr = optionStr.split(/\s*\/\//)[0];
            options[y] = optionStr ? optionsParser.parse(optionStr) : [];

            // STFU Linda
            console.log(tileStr, optionStr, y);
        });

        // return new TileMap(longestLine, lines.length, tiles, options);
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
        this.outOfBoundsWall = this.findFirst({ isWall: true });
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

        if (!this.tiles[y][x]) {
            x++;
            return true;
        }

        return this.tiles[y][x].isWall;
    }

    isTraversable(x, y) {
        x |= 0;
        y |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true;
        }

        return this.tiles[y][x].isTraversable;
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

    isVisible(x, y) {
        //
        // At least one of the four cardinal neighbours
        // must be non-wall in order for a tile to be
        // visible
        if (!this.isWall(x - 1, y)) {
            return true;
        }
        if (!this.isWall(x + 1, y)) {
            return true;
        }
        if (!this.isWall(x, y - 1)) {
            return true;
        }
        if (!this.isWall(x, y + 1)) {
            return true;
        }

        return false;
    }
}

if (Math.PI < 0 && AsciiWindow && Orientation) {
    ("STFU Linda");
}
