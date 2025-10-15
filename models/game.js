/*
 * The game object holds everything.
 * All the locations, players, characters, items, npcs, quests, loot, etc.
 *
 * It is a pseudo-singleton in that you should only ever create one.
 *
 * Serializing this object effectively saves the game.
 */

import { isIdSane, miniUid } from "../utils/id.js";
import { Xorshift32 } from "../utils/random.js";
import { ItemBlueprint } from "./item.js";
import { Player } from "./player.js";

/** @typedef {import("./character.js").Character} Character */
/** @typedef {import("./item.js").ItemAttributes} ItemAttributes */
/** @typedef {import("./item.js").ItemBlueprint} ItemBlueprint */

export class Game {
    _counter = 1_000_000;

    /** @type {Map<string,ItemBlueprint>} List of all item blueprints in the game */
    _itemBlueprints = new Map();

    /** @type {Map<string,Location>} The list of locations in the game */
    _locations = new Map();

    /**
     * The characters in the game.
     *
     * @protected
     * @type {Map<string,Character>}
     */
    _characters = new Map();

    /*
     * @protected
     * @type {Map<string,Player>} Map of users in the game username->Player
     */
    _players = new Map();

    /** @protected @type {Xorshift32} */
    _random;

    /** @type {Xorshift32} */
    get random() {
        return this._random;
    }

    /** @param {number} rngSeed Seed number used for randomization */
    constructor() {
        this.rngSeed = Date.now();
    }

    set rngSeed(rngSeed) {
        this._random = new Xorshift32(rngSeed);
    }

    getPlayerByUsername(username) {
        console.log("GETTING PLAYER: `%s`", username);
        return this._players.get(username);
    }

    /**
     * Atomic player creation.
     *
     * @param {string} username
     * @param {string?} passwordHash
     * @param {string?} salt
     *
     * @returns {Player|null} Returns the player if username wasn't already taken, or null otherwise.
     */
    createPlayer(username, passwordHash = undefined, salt = undefined) {
        if (this._players.has(username)) {
            return false;
        }

        const player = new Player(
            username,
            typeof passwordHash === "string" ? passwordHash : "",
            typeof salt === "string" && salt.length > 0 ? salt : miniUid(),
        );

        this._players.set(username, player);

        return player;
    }

    /**
     * Create an ItemBlueprint with a given blueprintId
     *
     * @param {string} blueprintId
     * @param {ItemAttributes} attributes
     *
     * @returns {ItemBlueprint|false}
     */
    addItemBlueprint(blueprintId, attributes) {
        if (typeof blueprintId !== "string" || !blueprintId) {
            throw new Error("Invalid blueprintId!");
        }

        const existing = this._itemBlueprints.get(blueprintId);

        if (existing) {
            console.debug("we tried to create the same item blueprint more than once", blueprintId, attributes);
            return existing;
        }

        attributes.blueprintId = blueprintId;

        const result = new ItemBlueprint(attributes);

        this._itemBlueprints.set(blueprintId, result);

        return result;
    }

    /**
     * @param {string} blueprintId
     * @returns {ItemBlueprint?}
     */
    getItemBlueprint(blueprintId) {
        if (!isIdSane(blueprintId)) {
            throw new Error(`blueprintId >>${blueprintId}<< is not a valid id`);
        }
        return this._itemBlueprints.get(blueprintId);
    }
}
