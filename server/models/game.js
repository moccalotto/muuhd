/*
 * The game object holds everything.
 * All the locations, players, characters, items, npcs, quests, loot, etc.
 *
 * It is a pseudo-singleton in that you should only ever create one.
 *
 * Serializing this object effectively saves the game.
 */

import WebSocket from "ws";
import { Character } from "./character.js";
import { ItemTemplate } from "./item.js";

export class Game{

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

    /**
     * All players ever registered, mapped by name => player.
     *
     * @protected
     * @type {Map<string,Player>} Map of users in the game username->Player
     */
    _players = new Map(); get players() { return this._players; }
}
