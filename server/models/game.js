/*
 * The game object holds everything.
 * All the locations, players, characters, items, npcs, quests, loot, etc.
 *
 * It is a pseudo-singleton in that you should only ever create one.
 *
 * Serializing this object effectively saves the game.
 */

import { miniUid } from "../utils/id.js";
import { Character } from "./character.js";
import { ItemTemplate } from "./item.js";
import { Player } from "./player.js";

export class Game {

    /** @type {Map<string,ItemTemplate>} List of all item templates in the game */
    _itemTemplates = new Map();

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

    getPlayer(username) {
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
            typeof salt === "string" && salt.length > 0 ? salt : miniUid()
        );

        this._players.set(username, player);

        return player;
    }

    /**
    * Create an ItemTemplate with a given ID
    *
    * @param {string} id
    * @param {object} attributes
    *
    * @returns {ItemTemplate|false}
    */
    createItemTemplate(id, attributes) {

        if (typeof id !== "string" || !id) {
            throw new Error("Invalid id!");
        }

        if (this._itemTemplates.has(id)) {
            return false;
        }

        /** @type {ItemTemplate}  */
        const result = new ItemTemplate(id, attributes.name, attributes.itemSlots);

        for (const key of Object.keys(result)) {
            if (key === "id") {
                continue;
            }
            if (key in attributes) {
                result[key] = attributes[key];
            }
        }


        this._itemTemplates.set(id, result);

        return result;
    }
}
