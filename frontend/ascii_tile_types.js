import { ParsedCall } from "../utils/callParser";
import { Orientation, Vector2i } from "./ascii_types";

export class Tile {
    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapChar;
    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapColor;
    /** @type {boolean} Should this be rendered as a wall? */
    looksLikeWall;
    /** @type {boolean} Can the player walk here? */
    isTraversable;
    /** @type {boolean} is this tile occupied by an encounter? */
    isEncounter;
    /** @type {boolean} Is this where they player starts? */
    isStartLocation;
    /** @type {boolean} Is this a two-way portal entry/exit */
    isTwoWayPortal;
    /** @type {boolean} Is this a one-way portal entry */
    isOneWayPortalEntry;
    /** @type {boolean} Is this a one-way portal exit */
    isOneWayPortalExit;
    /** @type {boolean} Has the secret properties of this tile been uncovered? */
    isUncovered;
    /** @type {string|number} The portals "channel" - each tile in a portal pair must have the same channel */
    channel;
    /** @type {number|string} id of texture to use */
    textureId;
    /** @type {number|string} id the encounter located on this tile */
    encounterId;
    /** @type {boolean} Can/does this tile wander around on empty tiles? */
    isRoaming;
    /** @type {Orientation} */
    orientation;

    /** @type {number} If this is a roaming tile, what is its current x-position on the map */
    currentPosX;
    /** @type {number} If this is a roaming tile, what is its current y-position on the map*/
    currentPosY;

    static wallMinimapChar = "█";

    /** @param {Tile} options */
    constructor(options = {}) {
        for (let [k, v] of Object.entries(options)) {
            if (this[k] !== undefined) {
                this[k] = v;
            }
        }
    }

    /**
     * @param {string} char
     * @param {ParsedCall} opt Options
     * @param {number} x
     * @param {number} y
     */
    static fromChar(char, opt, x, y) {
        opt = opt ?? new ParsedCall();
        if (!(opt instanceof ParsedCall)) {
            console.error("Invalid options", { char, opt: opt });
            throw new Error("Invalid options");
        }
        if (char === " ") return new FloorTile();
        if (char === "#") return new WallTile();
        if (char === "P") return new PlayerStartTile(opt.getValue("orientation", 0));
        if (char === "E") return new EncounterTile(x, y, opt.getValue("encounterId", 0), opt.getValue("textureId", 1));
        if (char === "O") return new SecretOneWayPortalEntryTile(opt.getValue("channel", 0));
        if (char === "o") return new SecretOneWayPortalExitTile(opt.getValue("channel", 0));
        if (char === "Z") return new SecretTwoWayPortalTile(opt.getValue("channel", 0));

        console.warn("Unknown character", { char, options: opt });
        return new FloorTile();
    }

    hasTexture() {
        if (this.textureId === "") {
            return false;
        }

        return typeof this.textureId === "number" || typeof this.textureId === "string";
    }

    clone() {
        return new this.constructor(this);
    }
}

export class FloorTile extends Tile {
    isTraversable = true;
    minimapChar = "·";
    minimapColor = "#555";
    internalMapChar = " ";
}

export class PlayerStartTile extends Tile {
    isTraversable = true;
    isStartLocation = true;
    minimapChar = "▤"; // stairs
    orientation = Orientation.NORTH;

    /** @param {Orientation} orientation */
    constructor(orientation) {
        super({ orientation });
    }
}

export class WallTile extends Tile {
    textureId = "wall";
    isTraversable = false;
    looksLikeWall = true;
    internalMapChar = "#";
    minimapChar = Tile.wallMinimapChar;
    minimapColor = "#aaa";
}

export class EncounterTile extends Tile {
    isEncounter = true;
    isRoaming = true;
    minimapChar = "†";
    minimapColor = "#faa";

    constructor(x, y, encounterId, textureId) {
        super();
        this.textureId = textureId ?? encounterId;
        this.encounterId = encounterId;
        this.currentPosX = x;
        this.currentPosY = y;
        console.info("creating encounter", { encounter: this });
    }
}
export class SpriteTile extends Tile {
    isTraversable = true;
    constructor(textureId, orientation) {
        console.debug({ textureId, orientation });
        super({ textureId, orientation: orientation ?? Orientation.NORTH });
    }
}

/**
 * One-way portal entries look exactly like walls. You need to
 * probe for them, or otherwise unlock their location.
 * You can walk into them, and then the magic happens
 */
export class SecretOneWayPortalEntryTile extends WallTile {
    textureId = 0;
    looksLikeWall = true;
    isTraversable = true; // we can walk in to it?
    isOneWayPortalEntry = true;
    internalMapChar = "O";
    isUncovered = false;

    // Change minimap char once the tile's secret has been uncovered.

    constructor(channel) {
        super({ channel });
    }
}

export class SecretOneWayPortalExitTile extends FloorTile {
    isOneWayPortalExit = true;
    internalMapChar = "o";
    isUncovered = false;
    //
    // Change minimap char once the tile's secret has been uncovered.

    constructor(channel) {
        super({ channel });
    }
}

export class SecretTwoWayPortalTile extends WallTile {
    isTraversable = true;
    isTwoWayPortalEntry = true;
    internalMapChar = "0";
    isUncovered = false;

    // Change minimap char once the tile's secret has been uncovered.

    constructor(channel) {
        super({ channel });
    }
}

if (Math.PI < 0 && ParsedCall && Orientation && Vector2i) {
    ("STFU Linda");
}
