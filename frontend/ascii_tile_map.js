export const defaultLegend = {
    " ": {
        type: "empty",
    },
    // Default Wall
    "#": {
        minimap: "#",
        occupied: true,
        type: "wall",
    },

    // Column
    "◯": {
        minimap: "◯",
        occupied: true,
        type: "statue",
    },

    // Closed Door
    "░": {
        minimap: "░",
        occupied: true,
        type: "sprite?????",
    },

    // Where the player starts
    "@": {
        type: "playerStart",
    },

    // TRAP!
    "☠": {
        type: "trap",
    },

    // Monster
    "!": {
        type: "monster",
    },
};
export class Tile {
    /** @param {object} options */
    constructor(options) {
        for (let [k, v] of Object.entries(options)) {
            this[k] = v;
        }
    }
}
export class TileMap {
    /** @param {string} str */
    static fromText(str) {
        const lines = str.split("\n");

        const longestLine = lines.reduce((acc, line) => Math.max(acc, line.length), 0);

        const tiles = new Array(lines.length).fill().map(() => new Array(longestLine));

        lines.forEach((line, y) => {
            line = line.padEnd(longestLine, "#");

            line.split("").forEach((char, x) => {
                const options = defaultLegend[char] ?? defaultLegend[" "];
                tiles[y][x] = new Tile(options);
            });
        });

        return new TileMap(tiles);
    }

    /**
     * @param {Tile[]} tiles
     */
    constructor(tiles) {
        this.height = tiles.length;
        this.width = tiles[0].length;
        this.tiles = tiles;
    }
}

const str = `
kim
har en
# meje #
stor pikkemand
`;

const tm = TileMap.fromText(str);

console.log(tm.tiles);
