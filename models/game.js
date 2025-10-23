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
import { Security } from "../utils/security.js";
import { ItemBlueprint } from "./item.js";
import { Player } from "./player.js";

/** @typedef {import("./character.js").Character} Character */
/** @typedef {import("./item.js").ItemAttributes} ItemAttributes */
/** @typedef {import("./item.js").ItemBlueprint} ItemBlueprint */

export class Game {
    #counter = 1_000_000;
    get counter() {
        return this.#counter;
    }

    /** @type {Map<string,ItemBlueprint>} List of all item blueprints in the game */
    #itemBlueprints = new Map();
    get itemBlueprints() {
        return this.#itemBlueprints;
    }

    /** @type {Map<string,Location>} The list of locations in the game */
    #locations = new Map();
    get locations() {
        return this.#locations;
    }

    /**
     * The characters in the game.
     *
     * @protected
     * @type {Map<string,Character>}
     */
    #characters = new Map();
    get characters() {
        return this.#characters;
    }

    /*
     * @protected
     * @type {Map<string,Player>} Map of users in the game username->Player
     */
    #players = new Map();
    get players() {
        return this.#players;
    }

    /** @protected @type {Xorshift32} */
    #random;

    /** @type {Xorshift32} */
    get random() {
        return this.#random;
    }

    /** @param {number} rngSeed Seed number used for randomization */
    constructor(rngSeed) {
        this.seedRNG(rngSeed);
    }

    seedRNG(rngSeed) {
        this.#random = new Xorshift32(rngSeed);
    }

    getPlayerByUsername(username) {
        console.log("GETTING PLAYER: `%s`", username);
        return this.#players.get(username);
    }

    /**
     * Atomic player creation.
     *
     * @param {string} username
     * @param {string?} passwordHash
     * @param {string?} salt
     *
     * @returns {Player|false} Returns the player if username wasn't already taken, or null otherwise.
     */
    createPlayer(username, passwordHash = undefined, salt = undefined) {
        if (this.#players.has(username)) {
            return false;
        }

        passwordHash ??= "";
        salt ??= Security.generateHash(miniUid());

        const player = new Player(username, passwordHash, salt);

        this.#players.set(username, player);

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

        const existing = this.#itemBlueprints.get(blueprintId);

        if (existing) {
            console.warn("we tried to create the same item blueprint more than once", blueprintId, attributes);
            return existing;
        }

        attributes.blueprintId = blueprintId;

        const result = new ItemBlueprint(attributes);

        this.#itemBlueprints.set(blueprintId, result);

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
        return this.#itemBlueprints.get(blueprintId);
    }
}
