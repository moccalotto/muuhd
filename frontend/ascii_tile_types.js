import { ParsedCall } from "../utils/callParser";
import { Orientation, Vector2i } from "./ascii_types";

export class Tile {
    /** @type {string|number} What is the id of this tile - only interactive tiles have IDs */
    id;

    /** @type {string} Icon char of tile */
    minimapChar;
    /** @type {string} Icon char of tile after tile's secrets have been revealed */
    revealedMinimapChar;
    /** @type {string} Icon of tile */
    minimapColor;
    /** @type {string} Icon char of tile after tile's secrets have been revealed */
    revealedMinimapColor;

    /** @type {boolean} Is this a portal exit and/or entry */
    isPortal;
    /** @type {string|number} Where is the player transported if they enter the portal */
    portalTargetId;

    /** @type {boolean} Should this be rendered as a wall? */
    looksLikeWall;
    /** @type {boolean} Can the player walk here? */
    isTraversable;
    /** @type {boolean} is this tile occupied by an encounter? */
    isEncounter;
    /** @type {boolean} Is this where they player starts? */
    isStartLocation;
    /** @type {boolean} Has the secret properties of this tile been revealed? */
    isRevealed;
    /** @type {string|number} */
    hasBumpEvent;
    /** @type {string|number} The portals "channel" - each tile in a portal pair must have the same channel */
    channel;
    /** @type {number|string} id of texture to use */
    textureId;
    /** @type {number|string} id of texture to use after the secrets of this tile has been revealed */
    revealedTextureId;
    /** @type {number|string} type of encounter located on this tile. May or may not be unique*/
    encounterType;
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
        if (char === "E")
            return new EncounterTile(x, y, opt.getValue("encounterType", 0), opt.getValue("textureId", 1));
        if (char === "Z")
            return new SecretPortalTile(
                opt.getValue("id", 0),
                opt.getValue("destinationid", 1),
                opt.getValue("orientation", 3),
            );

        console.warn("Unknown character", { char, options: opt });
        return new FloorTile();
    }

    hasTexture() {
        if (typeof this.textureId === "number") {
            return true;
        }
        if (typeof this.textureId === "string" && this.textureId !== "") {
            return true;
        }

        return false;
    }

    getBumpEvent() {
        return null;
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
    minimapColor = "#f44";
    hasBumpEvent = true;

    /**
     * @param {number} x x-component of the encounter's initial position
     * @param {number} y y-component of the encounter's initial position
     * @param {string|number} encounterType name/id of the encounter that will be triggered when player bumps into this tile
     * @param {string|number} textureId id of the texture to use.
     */
    constructor(x, y, encounterType, textureId) {
        super();
        this.textureId = textureId ?? encounterType;
        this.encounterType = encounterType;
        this.currentPosX = x;
        this.currentPosY = y;
        this.id = `E_${encounterType}_${x}_${y}`;
        console.info("creating encounter", { encounter: this });
    }

    getBumpEvent() {
        return ["attack", { encounterType: this.encounterType }];
    }
}

export class SecretPortalTile extends WallTile {
    revealedTextureId = "secretTwoWayPortal";
    isPortal = true;
    internalMapChar = "Z";
    isRevealed = false;
    revealedMinimapChar = "Ω";
    revealedMinimapColor = "#4f4";

    // Change minimap char once the tile's secret has been uncovered.

    constructor(id, portalTargetId, orientation) {
        super({ id, portalTargetId, orientation });
    }
}

if (Math.PI < 0 && ParsedCall && Orientation && Vector2i) {
    ("STFU Linda");
}
