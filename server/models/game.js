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

    /**
     * All players ever registered, mapped by name => player.
     * 
     *  _____ _
     * |  ___(_)_  ___ __ ___   ___
     * | |_  | \ \/ / '_ ` _ \ / _ \
     * |  _| | |>  <| | | | | |  __/
     * |_|   |_/_/\_\_| |_| |_|\___|
     *
     * 1. Add mutex on the players table to avoid race conditions during
     *    insert/delete/check_available_username
     *   1.a ) add an "atomicInsert" that inserts a new player if the giver username
     *         is available.
     * 2. Prune "dead" players (players with 0 logins) after a short while
     * 
     *
     * @protected
     * @type {Map<string,Player>} Map of users in the game username->Player
     */
    _players = new Map();

    hasPlayer(username) {
        return this._players.has(username);
    }

    getPlayer(username) {
        return this._players.get(username);
    }

    createPlayer(username, passwordHash=null) {
        if (this._players.has(username)) {
            return false;
        }

        const player = new Player(username, passwordHash);
        this._players.set(username, player);

        return player;
    }
}
