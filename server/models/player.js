import WebSocket from "ws";
import { Character } from "./character.js";

/**
 * Player Account.
 *
 * Contain persistent player account info.
 */
export class Player {
    /** 
     * @protected 
     * @type {string} unique username 
     */
    _username;
    get username() {
        return this._username;
    }

    /**
     * @protected
     * @type {string}
     */
    _passwordHash;
    get passwordHash() {
        return this._passwordHash;
    }

    /** @protected @type {Set<Character>} */
    _characters = new Set();
    get characters() {
        return this._characters;
    }

    /**
     * @param {string} username
     * @param {string} passwordHash
     */
    constructor(username, passwordHash) {
        this._username = username;
        this._passwordHash = passwordHash;

        this.createdAt = new Date();
    }

    setPasswordHash(hashedPassword) {
        this._passwordHash = hashedPassword;
    }
}
