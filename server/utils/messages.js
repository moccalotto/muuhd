/** 
 * Very bad logic error. Player must quit game, refresh page, and log in again.
 *
 * Client-->Server
 *      or
 * Server-->Client-->Plater
 */
export const MSG_CALAMITY = "calamity";

/** Tell recipient that an error has occurred */
export const MSG_ERROR = "e";

/**
 * Message to be displayed.
 *
 * Server-->Client-->Player
 */
export const MSG_MESSAGE = "m";

/**
 * Message contains the player's password (or hash or whatever).
 *
 * Player-->Client-->Server
 */
export const MSG_PASSWORD = "pass";

/**
 * Server-->Client-->Player
 *
 * Server tells the client to prompt the player for some info
 */
export const MSG_PROMPT = "ask";

/** 
 * Client sends the player's username to the server
 *
 * Player-->Client-->Server
 */
export const MSG_USERNAME = "user";

/** 
 * Player has entered a command, and wants to do something.
 *
 * Player-->Client-->Server
 */
export const MSG_COMMAND = "c";

/**
 * Represents a message sent from client to server.
 */
export class ClientMessage {
    /** 
     * @protected 
     * @type {any[]} _arr The array that contains the message data
     */
    _arr;

    /** The message type.
     *
     * One of the MSG_* constants from this document.
     *
     * @returns {string}
     */
    get type() {
        return this._arr[0];
    }


    /**
     * @param {string} msgData the raw text data in the websocket message.
     */
    constructor(msgData) {
        if (typeof msgData !== "string") {
            throw new Error("Could not create client message. Attempting to parse json, but data was not even a string, it was a " + typeof msgData);
            return
        }

        try {
            this._arr = JSON.parse(msgData);
        } catch (_) {
            throw new Error(`Could not create client message. Attempting to parse json, but data was invalid json: >>> ${msgData} <<<`);
        }

        if (typeof this._arr !== "array") {
            throw new Error(`Could not create client message. Excpected an array, but got a ${typeof this._arr}`);
        }

        if (this._arr.length < 1) {
            throw new Error("Could not create client message. Excpected an array with at least 1 element, but got an empty one");
        }

        this._arr = arr;
    }

    /** Does this message contain a message that should be displayed to the user the "normal" way? */
    isMessage() {
        return this._arr[0] === "m";
    }

    /** Does this message contain a username-response from the client? */
    hasUsername() {
        return this._arr[0] === MSG_USERNAME;
    }

    /** Does this message contain a password-response from the client? */
    hasPassword() {
        return this._arr[0] === MSG_PASSWORD;
    }

    /** @returns {string|false} Get the username stored in this message */
    get username() {
        return this.hasUsername() ? this._arr[1] : false;
    }

    /** @returns {string|false} Get the password stored in this message */
    get password() {
        return this.hasPassword() ? this._arr[1] : false;
    }

    get command() {
        return this.isCommand() ? this._attr[1] : false;
    }

    isCommand() {
        return this._raw[0] === MSG_COMMAND;
    }
}
