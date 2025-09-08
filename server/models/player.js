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

    /** @type {Date} */
    _createdAt = new Date();

    /** @type {Date|null} Date of the player's last websocket message. */
    lastActivityAt = null;

    /** @type {Date|null} Date of the player's last login. */
    lastSucessfulLoginAt = null;

    /** @type {number} Number of successful logins on this character */
    successfulLogins = 0;

    /** @type {number} Number of failed login attempts since the last good login attempt */
    failedPasswordsSinceLastLogin = 0;

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

        this._createdAt = new Date();
    }

    setPasswordHash(hashedPassword) {
        this._passwordHash = hashedPassword;
    }
}
