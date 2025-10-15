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
    /** @protected @type {string} */
    _id;
    get id() {
        return this._id;
    }

    /** @protected @type {string} */
    _name;
    get name() {
        return this._name;
    }

    /** @protected @type {string} */
    _description;
    get description() {
        return this._description;
    }

    /** @protected @type {Map<string,Portal>} */
    _portals = new Map();
    get portals() {
        return this._portals;
    }

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} description
     */
    constructor(id, name, description) {
        this._id = id;
        this._name = name;
        this._description = description;
    }
}
