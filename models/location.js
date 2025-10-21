/** @typedef {import("./portal.js").Portal} Portal */

/**
 * Location in the world.
 *
 * Can contain characters, quests, monsters, loot, NPCs and more.
 *
 * Can contain mundane portals (such as doors or pathways) to adjacent rooms/locations,
 * or magical portals to distant locations.
 */
export class Location {
    /** @type {string} */
    #id;
    get id() {
        return this.#id;
    }

    /** @type {string} */
    #name;
    get name() {
        return this.#name;
    }

    /** @type {string} */
    #description;
    get description() {
        return this.#description;
    }

    /** @type {Map<string,Portal>} */
    #portals = new Map();
    get portals() {
        return this.#portals;
    }

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} description
     */
    constructor(id, name, description) {
        this.#id = id;
        this.#name = name;
        this.#description = description;
    }
}
