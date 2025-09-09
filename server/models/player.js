import WebSocket from "ws";
import { Character } from "./character.js";

/**
 * Player Account.
 *
 * Contain persistent player account info.
 */
export class Player {

    /** @protected @type {string} unique username */
    _username;
    get username() {
        return this._username;
    }

    /** @protected @type {string} */
    _passwordHash;
    get passwordHash() {
        return this._passwordHash;
    }

    /** @protected @type {string} random salt used for hashing */
    _salt;
    get salt() {
        return this._salt;
    }

    /** @protected @type {Date} */
    _createdAt = new Date();
    get createdAt() {
        return this._createdAt;
    }

    /** @type {Date} */
    blockedUntil;


    /** @type {Date|null} Date of the player's last websocket message. */
    lastActivityAt = null;

    /** @type {Date|null} Date of the player's last login. */
    lastSucessfulLoginAt = null;

    /** @type {number} Number of successful logins on this character */
    successfulLogins = 0;

    /** @type {number} Number of failed login attempts since the last good login attempt */
    failedPasswordsSinceLastLogin = 0;

    /** @protected @type {Set<Character>} */
    _characters = new Set();    // should this be a WeakSet? After all if the player is removed, their items might remain in the system, right?
    get characters() {
        return this._characters;
    }

    /**
     * @param {string} username
     * @param {string} passwordHash
     * @param {string} salt
     */
    constructor(username, passwordHash, salt) {
        this._username = username;
        this._passwordHash = passwordHash;
        this._salt = salt;
        this._createdAt = new Date();
    }

    setPasswordHash(hashedPassword) {
        this._passwordHash = hashedPassword;
    }
}
