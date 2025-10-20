import { CharType, TileMap } from "./ascii_tile_map";
import { Tile, TileChars } from "./ascii_tile_types";
import { Orientation } from "./ascii_types";

/**
 * @typedef {object} RoomConfig
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/** Dungeon Generator - generates TileMaps populated with rooms, traps, encounters, etc. */
class DungeonFactory {
    /** @type {number} */
    roomCount;

    /** @type {RoomConfig[]} */
    rooms;

    /** @type {TileMap} */
    map;

    get width() {
        return this.map.width;
    }

    get height() {
        return this.map.height;
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {number} roomCount
     */
    constructor(width, height, roomCount) {
        this.roomCount = roomCount | 0;
        this.rooms = [];

        // 2d array of pure wall tiles
        const tiles = new Array(height | 0).fill().map(() => Array(width | 0).fill(Tile.createWall()));

        this.map = new TileMap(tiles);
    }

    generate() {
        this.generateRooms();
        this.connectRooms();
        this.trimMap();
        this.addPillarsToBigRooms();
        this.addFeatures();
        this.addPlayerStart();
        this.addPortals();
        return this.map.toString(CharType.TYPE_ID);
    }

    generateRooms() {
        this.rooms = [];
        const maxAttempts = this.roomCount * 10;
        let attempts = 0;

        while (this.rooms.length < this.roomCount && attempts < maxAttempts) {
            const room = this.generateRoom();
            if (room && !this.roomOverlaps(room)) {
                this.rooms.push(room);
                this.carveRoom(room);
            }
            attempts++;
        }
    }

    generateRoom() {
        const minSize = 4;
        const maxSize = Math.min(12, Math.floor(Math.min(this.width, this.height) / 4));

        const width = this.random(minSize, maxSize);
        const height = this.random(minSize, maxSize);
        const x = this.random(1, this.width - width - 1);
        const y = this.random(1, this.height - height - 1);

        return { x, y, width, height };
    }

    roomOverlaps(newRoom) {
        return this.rooms.some(
            (room) =>
                newRoom.x < room.x + room.width + 2 &&
                newRoom.x + newRoom.width + 2 > room.x &&
                newRoom.y < room.y + room.height + 2 &&
                newRoom.y + newRoom.height + 2 > room.y,
        );
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.map.tiles[y][x] = Tile.createFloor();
            }
        }
    }

    connectRooms() {
        if (this.rooms.length < 2) return;

        // Connect each room to at least one other room
        for (let i = 1; i < this.rooms.length >> 1; i++) {
            const roomA = this.rooms[i - 1];
            const roomB = this.rooms[i];
            this.createCorridor(roomA, roomB);
        }

        // Add some extra connections for more interesting layouts
        const extraConnections = Math.floor(this.rooms.length / 3);
        for (let i = 0; i < extraConnections; i++) {
            const roomA = this.rooms[this.random(0, this.rooms.length - 1)];
            const roomB = this.rooms[this.random(0, this.rooms.length - 1)];
            if (roomA !== roomB) {
                this.createCorridor(roomA, roomB);
            }
        }
    }

    // Remove unnecessary walls that frame the rooms
    // The dungeon should only be framed by a single
    // layer of walls
    trimMap() {
        let dungeonStartY = undefined;
        let dungeonEndY = 0;

        let dungeonStartX = this.width; // among all rows, when did we first see a non-wall tile on the west-side of the map?
        let dungeonEndX = 0; // among all rows, when did we last see a non-wall tile on the east-side of the map?

        for (let y = 0; y < this.height; y++) {
            //
            let firstNonWallX = undefined; // x-index of the FIRST (westmost) non-wall tile that we encountered on this row
            let lastNonWallX = undefined; // x-index of the LAST (eastmost) non-wall tile that we encountered on this row

            for (let x = 0; x < this.width; x++) {
                //
                if (this.map.get(x, y).isWall()) {
                    continue;
                }

                firstNonWallX ??= x;
                lastNonWallX = x;
            }

            // Did this row contain only walls?
            if (firstNonWallX === undefined) {
                continue;
            }

            //
            // X-axis bookkeeping
            if (dungeonStartX > 0 && lastNonWallX < this.width) {
                dungeonStartX = Math.min(dungeonStartX, firstNonWallX);
                dungeonEndX = Math.max(dungeonEndX, lastNonWallX);
            }

            //
            // Y-Axis bookkeeping
            if (dungeonStartY === undefined) {
                dungeonStartY = y;
            }
            dungeonEndY = y;
        }

        const newWidth = dungeonEndX - dungeonStartX + 3;

        const newTiles = [];

        // First row is all walls
        newTiles.push(new Array(newWidth).fill(Tile.createWall()));

        // Populate the new grid
        for (let y = dungeonStartY; y <= dungeonEndY; y++) {
            const row = [];

            row.push(Tile.createWall()); // Initial wall tile on this row
            for (let x = dungeonStartX; x <= dungeonEndX; x++) {
                /**/
                const tile = this.map.get(x, y);
                row.push(tile);
            }
            row.push(Tile.createWall()); // Final wall tile on this row
            newTiles.push(row);
        }

        // Final row is all walls
        newTiles.push(new Array(newWidth).fill(Tile.createWall()));

        this.map = new TileMap(newTiles);
    }

    createCorridor(roomA, roomB) {
        const startX = Math.floor(roomA.x + roomA.width / 2);
        const startY = Math.floor(roomA.y + roomA.height / 2);
        const endX = Math.floor(roomB.x + roomB.width / 2);
        const endY = Math.floor(roomB.y + roomB.height / 2);

        // Create L-shaped corridor
        if (Math.random() < 0.5) {
            // Horizontal first, then vertical
            this.carveLine(startX, startY, endX, startY);
            this.carveLine(endX, startY, endX, endY);
        } else {
            // Vertical first, then horizontal
            this.carveLine(startX, startY, startX, endY);
            this.carveLine(startX, endY, endX, endY);
        }
    }

    carveLine(x1, y1, x2, y2) {
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);

        let x = x1;
        let y = y1;

        while (x !== x2 || y !== y2) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.map.tiles[y][x] = Tile.createFloor();
            }

            if (x !== x2) x += dx;
            if (y !== y2 && x === x2) y += dy;
        }

        // Ensure endpoint is carved
        if (x2 >= 0 && x2 < this.width && y2 >= 0 && y2 < this.height) {
            this.map.tiles[y2][x2] = Tile.createFloor();
        }
    }

    addPillarsToBigRooms() {
        const walkabilityCache = [];
        for (let y = 1; y < this.height - 1; y++) {
            //
            for (let x = 1; x < this.width - 1; x++) {
                const cell = this.map.get(x, y);

                if (!cell) {
                    console.warn("out of bounds [%d, %d] (%s)", x, y, typeof cell);
                    continue;
                }

                if (this.map.get(x, y).isFloor()) {
                    walkabilityCache.push([x, y]);
                }
            }
        }

        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1)); // random index 0..i
                [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
            }
            return arr;
        };

        shuffle(walkabilityCache);

        for (let [x, y] of walkabilityCache) {
            //
            const walkable = (offsetX, offsetY) => this.map.isFloorLike(x + offsetX, y + offsetY);

            const surroundingFloorCount =
                0 +
                // top row ------------|-----------
                walkable(-1, -1) + //  | north west
                walkable(+0, -1) + //  | north
                walkable(+1, -1) + //  | north east
                // middle row ---------|-----------
                walkable(-1, +0) + //  | west
                //                     | self
                walkable(+1, +0) + //  | east
                // bottom row ---------|-----------
                walkable(-1, +1) + //  | south west
                walkable(+0, +1) + //  | south
                walkable(+1, +1); //   | south east
            // ----------------------------|-----------

            if (surroundingFloorCount >= 7) {
                // MAGIC NUMBER 7
                this.map.tiles[y][x] = Tile.createWall();
            }
        }
    }

    addPlayerStart() {
        const walkabilityCache = [];
        for (let y = 1; y < this.height - 1; y++) {
            //
            for (let x = 1; x < this.width - 1; x++) {
                const cell = this.map.get(x, y);

                if (!cell) {
                    console.warn("out of bounds [%d, %d] (%s)", x, y, typeof cell);
                    continue;
                }

                if (this.map.isFloorLike(x, y)) {
                    walkabilityCache.push([x, y]);
                }
            }
        }

        const idx = this.random(0, walkabilityCache.length - 1);
        const [x, y] = walkabilityCache[idx];

        const walkable = (offsetX, offsetY) => this.map.isFloorLike(x + offsetX, y + offsetY);

        //
        // When spawning in, which direction should the player be oriented?
        //
        const directions = [];
        if (walkable(+1, +0)) directions.push(Orientation.EAST);
        if (walkable(+0, +1)) directions.push(Orientation.NORTH);
        if (walkable(-1, +0)) directions.push(Orientation.WEST);
        if (walkable(+0, -1)) directions.push(Orientation.SOUTH);

        // Player's initial orientation is randomized in such a way that
        // they don't face a wall upon spawning.
        const dirIdx = this.random(0, directions.length - 1);

        this.map.tiles[y][x] = Tile.createPlayerStart(directions[dirIdx]);
    }

    // Add portals to isolated areas
    addPortals() {
        let traversableTileCount = this.map.getFloorlikeTileCount();

        //
        // Find the player's start point, and let this be the
        // bases of area 0
        const [x, y] = this.map.forEach((tile, x, y) => {
            if (tile.typeId === TileChars.PLAYER_START_POINT) {
                return [x, y];
            }
        });

        const result = this.map.getAllTraversableTilesConnectedTo(x, y);

        if (result.size === traversableTileCount) {
            // There are no isolated areas, return
            return;
        }

        //  _____ ___  ____   ___
        // |_   _/ _ \|  _ \ / _ \
        //   | || | | | | | | | | |
        //   | || |_| | |_| | |_| |
        //   |_| \___/|____/ \___/
        //----------------------------------------------
        // Connect isolated rooms via a chain of portals
        //----------------------------------------------
        //
        //      LET Area0 = getAllTilesConnectedTo(playerStartTile)
        //      LET Areas = Array containing one item so far: Area0
        //      FOR EACH tile in this.map
        //          IF tile NOT in any Area
        //              LET newArea = getAllTilesConnectedTo(tile)
        //              PUSH newArea ONTO Areas
        //
        //      FOR EACH (index, area) IN Areas
        //          LET next = index + 1 mod LENGTH(Areas)
        //          entryPos = findValidPortalEntryPositionInArea(area) // entry is a pure wall tile that is exactly one adjacent floor tile - and that floor tile must be pure
        //          exitPos = findValidPortalExitPositionInArea(area) // must be a valid pure floor tile with one or more adjacent floor tiles, at least on of which are pure
        //
        //          this.map[entryPos.y, entryPos.x] = new PortalEntryTile(index) // Create a portal in the current area
        //          this.map[exitPos.y, exitPos.x] = new PortalExitTile(next) // let the exit to the portal reside in the next area
        //

        console.warn(
            "unpassable! There are %d floor tiles, but the player can only visit %d of them",
            traversableTileCount,
            result.size,
        );
    }

    //
    //
    addFeatures() {
        const floorTiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.map.get(x, y).isFloor()) {
                    floorTiles.push({ x, y });
                }
            }
        }

        if (floorTiles.length === 0) {
            return;
        }

        // Add loot
        // const lootCount = Math.min(3, Math.floor(this.rooms.length / 2));
        // for (let i = 0; i < lootCount; i++) {
        //     const pos = floorTiles[this.random(0, floorTiles.length - 1)];
        //     if (this.map.tiles[pos.y][pos.x].isFloor()) {
        //         this.map.tiles[pos.y][pos.x] = new LootTile(undefined, undefined);
        //     }
        // }

        // Add monsters
        const encouterCount = Math.min(5, this.rooms.length);
        for (let i = 0; i < encouterCount; i++) {
            const pos = floorTiles[this.random(0, floorTiles.length - 1)];
            if (this.map.tiles[pos.y][pos.x].isFloor()) {
                this.map.tiles[pos.y][pos.x] = Tile.createEncounterStartPoint("PLACEHOLDER_ENCOUNTER_ID");
                // TODO: Add encounter to the dungeon's "roaming entities" array.
            }
        }

        // Add traps
        // const trapCount = Math.floor(floorTiles.length / 30);
        // for (let i = 0; i < trapCount; i++) {
        //     const pos = floorTiles[this.random(0, floorTiles.length - 1)];
        //     if (this.map.tiles[pos.y][pos.x].isFloor()) {
        //         this.map.tiles[pos.y][pos.x] = new TrapTile();
        //     }
        // }
    }

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

/** @type {HTMLInputElement} */
const widthEl = document.getElementById("width");
/** @type {HTMLInputElement} */
const heightEl = document.getElementById("height");
/** @type {HTMLInputElement} */
const roomCountEl = document.getElementById("roomCount");
/** @type {HTMLElement} */
const dungeonDisplayEl = document.getElementById("dungeonDisplay");

/** @type {string} */
export let currentDungeon = "";

export const generateDungeon = () => {
    const width = parseInt(widthEl.value);
    const height = parseInt(heightEl.value);
    const roomCount = parseInt(roomCountEl.value);

    const generator = new DungeonFactory(width, height, roomCount);

    currentDungeon = generator.generate();
    dungeonDisplayEl.textContent = currentDungeon;
};

export const downloadDungeon = () => {
    if (!currentDungeon) {
        generateDungeon();
    }

    const blob = new Blob([currentDungeon], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dungeon_map.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

widthEl.addEventListener("input", function () {
    document.getElementById("widthValue").textContent = this.value;
});

heightEl.addEventListener("input", function () {
    document.getElementById("heightValue").textContent = this.value;
});

roomCountEl.addEventListener("input", function () {
    document.getElementById("roomCountValue").textContent = this.value;
});

// Generate initial dungeon
generateDungeon();

window.generateDungeon = generateDungeon;
window.downloadDungeon = downloadDungeon;
