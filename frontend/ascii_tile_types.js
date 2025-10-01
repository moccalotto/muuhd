import { Orientation } from "./ascii_types";

export class Tile {
    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapChar;
    /** @type {string} How should this tile be rendered on the minimap.*/
    minimapColor;
    /** @type {boolean} Should this be rendered as a wall? */
    isWall;
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
    isWandering;
    /** @type {Orientation} */
    orientation;

    /** @param {Tile} options */
    constructor(options) {
        for (let [k, v] of Object.entries(options)) {
            if (this[k] !== undefined) {
                this[k] = v;
            }
        }
    }

    /** @param {Tile} options */
    static fromChar(char, options = {}) {
        switch (char) {
            case " ":
                return new FloorTile();
            case "#":
                return new WallTile();
            case "P":
                return new PlayerStartTile(options.orientation);
            case "E":
                return new EncounterTile(options.textureId, options.encounterId);
            case "O":
                return new SecretOneWayPortalEntryTile(options.channel);
            case "o":
                return new SecretOneWayPortalExitTile(options.channel);
            case "Z":
                return new SecretTwoWayPortalTile(options.channel);
            default:
                throw new Error("Unknown character: " + char);
        }
    }

    clone() {
        return new this.constructor(this);
    }
}

export class FloorTile extends Tile {
    isTraversable = true;
    minimapChar = " ";
    internalMapChar = " ";
}

export class PlayerStartTile extends Tile {
    isTraversable = true;
    isStartLocation = true;
    MinimapChar = "▤"; // stairs
    orientation = Orientation.NORTH;

    /** @param {Orientation} orientation */
    constructor(orientation) {
        super({ orientation });
    }
}

export class WallTile extends Tile {
    textureId = 0;
    isTraversable = false;
    isWall = true;
    minimapChar = "#";
    internalMapChar = "#";
}

export class EncounterTile extends Tile {
    isEncounter = true;
    constructor(textureId, encounterId) {
        super({ textureId, encounterId });
    }
}

/**
 * One-way portal entries look exactly like walls. You need to
 * probe for them, or otherwise unlock their location.
 * You can walk into them, and then the magic happens
 */
export class SecretOneWayPortalEntryTile extends Tile {
    textureId = 0;
    isWall = true;
    isTraversable = true; // we can walk in to it?
    isOneWayPortalEntry = true;
    internalMapChar = "O";
    minimapChar = "#"; // Change char when the portal has been uncovered
    isUncovered = false;

    constructor(channel) {
        super({ channel });
    }
}

export class SecretOneWayPortalExitTile extends Tile {
    isTraversable = true;
    isOneWayPortalExit = true;
    internalMapChar = "o";
    minimapChar = " "; // Change char when the portal has been uncovered
    isUncovered = false;

    constructor(channel) {
        super({ channel });
    }
}

export class SecretTwoWayPortalTile extends Tile {
    textureId = 0;
    isWall = true;
    isTraversable = true;
    isTwoWayPortalEntry = true;
    internalMapChar = "0";
    minimapChar = "#"; // Change char when the portal has been uncovered
    isUncovered = false;

    constructor(channel) {
        super({ channel });
    }
}
