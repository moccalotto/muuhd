import { mustBe, mustBeString } from "../utils/mustbe.js";
import shallowCopy from "../utils/shallowCopy.js";
import { TileOptions } from "../utils/tileOptionsParser.js";
import { Orientation, Vector2i } from "./ascii_types.js";

/**
 * Array of __internal__ characters used to identify tile types.
 * These are __not__ necessarily the characters used to display
 * the tile on the minimap - but they are used when serializing
 * the maps into a semi-human-readable text-format.
 *
 * @constant {Record<string,string}
 */
export const TileChars = Object.freeze({
    FLOOR: " ",
    WALL: "#",
    SECRET_PORTAL: "Z",
    TELPORTATION_TARGET: "_",
    ENCOUNTER_START_POINT: "E",
    PLAYER_START_POINT: "P",
});

const REQUIRED_ID = Symbol("REQUIRED_ID");
const REQUIRED_ORIENTATION = Symbol("REQUIRED_ORIENTATION");
const REQUIRED_OCCUPANTS = Symbol("REQUIRED_OCCUPANTS");

/** @type {Record<string,Tile>} */
export const TileTypes = {
    [TileChars.FLOOR]: {
        minimapChar: "·",
        traversable: true,
    },
    [TileChars.WALL]: {
        minimapChar: "█",
        minimapColor: "#aaa",
        textureId: "wall",
        traversable: false,
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
        disguiseAs: TileChars.FLOOR,
        revealedMinimapChar: "𝑥",
        revealedMinimapColor: "#EE82EE", // purple
    },
    [TileChars.ENCOUNTER_START_POINT]: {
        is: TileChars.FLOOR, // this is actually just a floor tile that is occupied by an encounter when the map is loaded
        encounterId: REQUIRED_ID,
        textureId: REQUIRED_ID,
        occupants: REQUIRED_OCCUPANTS,
    },
    [TileChars.PLAYER_START_POINT]: {
        is: TileChars.FLOOR,
        orientation: REQUIRED_ORIENTATION,
        minimapChar: "▤", // stairs/ladder
        minimapColor: "#FFF",
    },
};

export class Tile {
    /** @readonly {string?|number?} Unique (but optional) instance if of this tile */
    id;
    /** @type {string} Icon char of tile */
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
    /** @type {string|number} Where is the player transported if they enter the portal */
    portalTargetId;
    /** @type {number|string} id of texture to use */
    textureId;
    /** @type {number|string} type of encounter located on this tile. May or may not be unique*/
    encounterType;
    /** @type {number|string} type of trap located on this tile. May or may not be unique*/
    trapType;
    /** @type {Orientation} */
    orientation;
    /** @type {TileType} This tile disguises itself as another tile, and its true properties are revealed later if event is triggered */
    disguiseAs;
    /** @type {boolean} Has the secret properties of this tile been revealed? */
    revealed;
    /** @type {string} Icon char of tile after tile's secrets have been revealed */
    revealedMinimapChar;
    /** @type {string} Color of the icon char of tile after tile's secrets have been revealed */
    revealedMinimapColor;
    /** @type {number|string} id of texture to use after the secrets of this tile has been revealed */
    revealedTextureId;

    /** @param {Tile} properties */
    constructor(properties) {
        mustBe(properties, "object");

        //
        // Copy props from properties.
        //
        for (const [key, val] of Object.entries(properties)) {
            if (typeof val === "symbol" && val.description.startsWith("REQUIRED_")) {
                console.error(
                    [
                        "REQUIRED_ symbol encountered in Tile constructor. ",
                        "REQUIRED_ is a placeholder, and cannot be used as a value directly",
                    ].join("\n"),
                    { key, val, options: properties },
                );
                throw new Error("Incomplete data in constructor. Args may not contain a data placeholder");
            }

            if (!Object.hasOwn(this, key) /* Object.prototype.hasOwnProperty.call(this, key) */) {
                console.warn("Unknown tile property", { key, val, properties });
            }
        }

        //
        // If this tile is disguised, copy its attributes, but
        // do not overwrite own attributes.
        //
        if (this.disguiseAs !== undefined) {
            this.revealed = false;

            const other = shallowCopy(TileTypes[this.is]);
            for (const [pKey, pVal] of Object.entries(other)) {
                if (this.key !== undefined) {
                    this[pKey] = pVal;
                }
            }
        }

        //
        // If this tile "inherits" properties from another tile type,
        // copy those properties, but do not overwrite own attributes.
        //
        if (this.is !== undefined) {
            //
            const other = shallowCopy(TileTypes[this.is]);
            for (const [pKey, pVal] of Object.entries(other)) {
                if (this.key !== undefined) {
                    this[pKey] = pVal;
                }
            }
        }

        //
        // Normalize Orientation
        //
        if (this.orientation !== undefined && typeof this.orientation === "string") {
            const valueMap = {
                north: Orientation.NORTH,
                south: Orientation.SOUTH,
                east: Orientation.EAST,
                west: Orientation.WEST,
            };
            this.orientation = mustBeString(valueMap[this.orientation.toLowerCase()]);
        }

        if (this.id !== undefined) {
            mustBe(this.id, "number", "string");
        }
        if (this.textureId !== undefined) {
            mustBe(this.textureId, "number", "string");
        }
        if (this.portalTargetId !== undefined) {
            mustBe(this.portalTargetId, "number", "string");
        }
    }

    /**
     * @param {string} char
     * @param {TileOptions} options Options
     * @param {number} x
     * @param {number} y
     */
    static fromChar(char, options) {
        //
        // Validate Options
        options = options ?? new TileOptions();
        if (!(options instanceof TileOptions)) {
            console.error("Invalid options", { char, opt: options });
            throw new Error("Invalid options");
        }

        const typeInfo = TileTypes[char];

        let optionPos = 0;
        const creationArgs = {};
        const getOption = (name) => options.getValue(name, optionPos++);
        for (let [key, val] of Object.entries(typeInfo)) {
            //
            const fetchFromOption = typeof val === "symbol" && val.descript.startsWith("REQUIRED_");

            creationArgs[key] = fetchFromOption ? getOption(key) : shallowCopy(val);
        }
    }

    clone() {
        return new this.constructor(this);
    }
}

if (Math.PI < 0 && TileOptions && Orientation && Vector2i) {
    ("STFU Linda");
}
