import { mustBe } from "../utils/mustbe.js";
import shallowCopy from "../utils/shallowCopy.js";
import { TileOptions } from "../utils/tileOptionsParser.js";
import { Orientation } from "./ascii_types.js";

/** @typedef {string} TileTypeId - a string with a length of 1 */
/** @typedef {string} MinimapGrapheme - a string containing a single grapheme */
/** @typedef {string|number} ResourceId - id of a resource (such as a texture or another tile) used by a tile */

/**
 * Array of __internal__ characters used to identify tile types.
 * These are __not necessarily__ the characters used to display
 * the tile on the minimap - but they are used when serializing
 * the maps into a human-readable text-format.
 *
 * @enum {TileTypeId}
 */
export const TileChars = Object.freeze({
    FLOOR: " ",
    WALL: "#",
    SECRET_PORTAL: "Z",
    TELPORTATION_TARGET: "_",
    ENCOUNTER_START_POINT: "E",
    PLAYER_START_POINT: "P",
});

/**
 * Properties whose value matches one of these constants
 * must have their actual value supplied by the creator
 * of the Tile object.
 *
 * For instance, if a Tile has a textureId = REQUIRED_ID, then
 * the creator of that Tile MUST supply the textureId before the tile can
 * be used in the game Such values SHOULD be provided in the constructor,
 * but CAN be provided later, as long as they are provided before the
 * tile is used in the actual game.
 */

/** Properties with this value must be valid ID values. */
const REQUIRED_ID = Symbol("REQUIRED_ID");
const REQUIRED_ORIENTATION = Symbol("REQUIRED_ORIENTATION");

function sanitizeId(value) {
    if ((value | 0) === value) {
        return value;
    }

    if (typeof value !== "string") {
        throw new Error("Value is not a valid id", { value });
    }

    value = value.trim();

    if (value === "") {
        throw new Error("Value is not a valid id", { value });
    }

    return value;
}
function sanitizeOrientation(value) {
    const result = Orientation.normalize(value);

    if (result === undefined) {
        throw new Error("Value is not a valid orientation", { value });
    }

    return result;
}

function mustBeSingleGrapheme(value) {
    if (typeof value !== "string") {
        throw new Error("Value is not a one-grapheme string", { value });
    }

    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });

    if ([...seg.segment(value)].length !== 1) {
        throw new Error("Value is not a one-grapheme string", { value });
    }

    return value;
}

/** @type {Record<TileTypeId,Tile>} */
export const TileTypes = {
    [TileChars.FLOOR]: {
        minimapChar: "·",
        isTraversable: true,
    },
    [TileChars.WALL]: {
        minimapChar: "█",
        minimapColor: "#aaa",
        textureId: "wall",
        isTraversable: false,
        looksLikeWall: true,
    },
    [TileChars.SECRET_PORTAL]: {
        disguiseAs: TileChars.WALL,
        revealedMinimapChar: "Ω",
        revealedMinimapColor: "#EE82EE", //purple
        revealedTextureId: "secret_portal_revealed",
        portalTargetId: REQUIRED_ID,
        looksLikeWall: true,
    },
    [TileChars.TELPORTATION_TARGET]: {
        is: TileChars.FLOOR,
        id: REQUIRED_ID,
        orientation: REQUIRED_ORIENTATION,
        revealedMinimapChar: "𝑥",
        revealedMinimapColor: "#EE82EE", // purple
    },
    [TileChars.ENCOUNTER_START_POINT]: {
        is: TileChars.FLOOR, // this is actually just a floor tile that is occupied by an encounter when the map is loaded
        encounterId: REQUIRED_ID,
        textureId: REQUIRED_ID,
    },
    [TileChars.PLAYER_START_POINT]: {
        is: TileChars.FLOOR,
        orientation: REQUIRED_ORIENTATION,
        minimapChar: "▤", // stairs/ladder
        minimapColor: "#FFF",
    },
};

export class Tile {
    /** @readonly {ResourceId?} Unique (but optional) instance id of this tile - only needed when this tile is referenced by other tiles */
    id;

    /** @type {TileTypeId} Char that defines this tile */
    typeId;

    /** @type {MinimapGrapheme} Icon char of tile */
    minimapChar;

    /** @type {string} Color of the icon of tile */
    minimapColor;

    /** @type {boolean} Can the player walk here? */
    isTraversable;

    /** @type {boolean} Should this be rendered as a wall? */
    looksLikeWall;

    /** @type {boolean} Is this where they player starts? */
    isStartLocation;

    /** @type {boolean} Is this a portal exit and/or entry */
    isPortal;

    /** @type {ResourceId} id of the type where players will be transported - many portals may share same target */
    portalTargetId;

    /** @type {ResourceId} id of texture to use - does not need to be unique */
    textureId;

    /** @type {ResourceId} id of encounter located on this tile. May or may not be unique */
    encounterId;

    /** @type {Orientation} */
    orientation;

    /** @type {TileTypeId} This tile disguises itself as another tile, and its true properties are revealed later if event is triggered */
    disguiseAs;

    /** @type {TileTypeId} This tile "inherits" the properties of another tile type */
    is;

    /** @type {boolean} Has the secret properties of this tile been revealed? */
    revealed;

    /** @type {MinimapGrapheme} Icon char of tile after tile's secrets have been revealed */
    revealedMinimapChar;

    /** @type {string} Color of the icon char of tile after tile's secrets have been revealed */
    revealedMinimapColor;

    /** @type {ResourceId} id of texture to use after the secrets of this tile has been revealed */
    revealedTextureId;

    /** @returns {Tile} */
    static createWall() {
        return this.fromChar(TileChars.WALL);
    }

    /** @returns {Tile} */
    static createEncounterStartPoint(encounterId) {
        return this.fromChar(TileChars.ENCOUNTER_START_POINT, { encounterId });
    }

    /** @returns {Tile} */
    static createFloor() {
        return this.fromChar(TileChars.FLOOR);
    }

    /** @returns {Tile} */
    static createPlayerStart(orientation) {
        return this.fromChar(TileChars.PLAYER_START_POINT, { orientation });
    }

    /**
     * Given a map symbol,
     * @param {TileTypeId} typeId
     * @param {TileOptions|Record<string,any>} options
     * @returns {Tile}
     */
    static fromChar(typeId, options) {
        const prototype = TileTypes[typeId];

        if (!prototype) {
            console.log("unknown type id", { typeId });
            throw new Error(`Unknown typeId >>>${typeId}<<<`);
        }

        //
        // Normalize options into a TileOptions object,
        //
        if (!(options instanceof TileOptions)) {
            options = TileOptions.fromObject(typeId, options ?? {});
        }

        let optionPos = 0;
        const properties = {};

        for (let [key, val] of Object.entries(prototype)) {
            //
            if (typeof val === "symbol" && val.description.startsWith("REQUIRED_")) {
                properties[key] = options.getValue(name, optionPos++);
            } else {
                properties[key] = shallowCopy(val);
            }
        }

        return new Tile(typeId, properties);
    }

    /**
     * @param {TileTypeId} typeId
     * @param {Tile?} properties
     */
    constructor(typeId, properties) {
        mustBe(properties, "object");

        this.typeId = typeId;

        //
        // Copy props from properties.
        //
        for (const [key, val] of Object.entries(properties)) {
            //
            // Skip empty properties.
            if (val === undefined) {
                continue;
            }

            if (!Object.hasOwn(this, key) /* Object.prototype.hasOwnProperty.call(this, key) */) {
                console.warn("Unknown tile property", { key, val, properties });
                continue;
            }
        }

        //
        // If this tile imitates another tile type, copy those tile
        // types without overwrite own properties.
        //
        // Example: SECRET_PORTALs are disguised as walls, and will
        // look like walls until they are revealed/uncovered via
        // bump event, spell, or other method for discovering secrets
        //
        if (this.disguiseAs !== undefined) {
            this.revealed ??= false;

            const other = shallowCopy(TileTypes[this.disguiseAs]);
            for (const [pKey, pVal] of Object.entries(other)) {
                this[pKey] ??= pVal;
            }
        }

        //
        // If this tile "inherits" properties from another tile type,
        // copy those properties, but do not overwrite own attributes.
        //
        // Example: PLAYER_START_POINT is just a floor tile, since its only job
        // is to server as a place to spawn the player when they enter this floor,
        // as well as add an icon to the minimap
        //
        // Example: ENCOUNTER_START_POINT is just a floor type. It does
        // carry data on which kind if encounter that spawns here, and some
        // other encounter properties. This tile is not even shown on the minmap.
        //
        if (this.is !== undefined) {
            //
            const other = shallowCopy(TileTypes[this.is]);
            for (const [pKey, pVal] of Object.entries(other)) {
                this[pKey] ??= pVal;
            }
        }

        //
        // Populate derivable values that have not yet been set.
        this.minimapChar ??= this.typeId;
        this.revealedMinimapChar ??= this.minimapChar;
        this.revealedMinimapColo ??= this.minimapColor;

        //
        // Sanitize and normalize
        //
        if (this.id !== undefined) {
            this.id = sanitizeId(this.id);
        }
        if (this.textureId !== undefined) {
            this.textureId = sanitizeId(this.textureId);
        }
        if (this.portalId !== undefined) {
            this.portalTargetId = sanitizeId(this.portalTargetId);
        }
        if (this.orientation !== undefined) {
            this.orientation = sanitizeOrientation(this.orientation);
        }

        mustBeSingleGrapheme(this.typeId);
        mustBeSingleGrapheme(this.minimapChar);
        mustBeSingleGrapheme(this.revealedMinimapChar);
    }

    clone() {
        return new Tile(this.typeId, { ...this });
    }

    isWallLike() {
        if (this.typeId === TileChars.WALL) {
            return true;
        }

        if (this.is === TileChars.WALL) {
            return true;
        }

        if (this.disguiseAs === TileChars.WALL) {
            return true;
        }

        return this.looksLikeWall && !this.isTraversable;
    }

    isWall() {
        return this.typeId === TileChars.WALL;
    }

    isFloorlike() {
        if (this.typeId === TileChars.FLOOR) {
            return true;
        }

        if (this.is === TileChars.FLOOR) {
            return true;
        }

        if (this.disguiseAs === TileChars.FLOOR) {
            return true;
        }

        return this.isTraversable;
    }

    isFloor() {
        return this.typeId === TileChars.FLOOR;
    }
}
