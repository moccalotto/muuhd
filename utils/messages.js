import { mustBe, mustBeString, mustMatch } from "./mustbe.js";

export const MessageType = Object.freeze({
    /**
     * Very bad logic error. Player must quit game, refresh page, and log in again.
     *
     * Client-->Server
     *      or
     * Server-->Client-->Plater
     */
    CALAMITY: "CALAMITY",

    /**
     * Tell recipient that an error has occurred
     *
     * Server-->Client-->Player
     */
    ERROR: "E",

    /**
     * Message to be displayed.
     *
     * Server-->Client-->Player
     */
    TEXT: "T",

    /**
     * Player has entered data, and sends it to server.
     *
     * Player-->Client-->Server
     */
    REPLY: "R",

    /**
     * Player wants to quit.
     *
     * Player-->Client-->Server
     */
    QUIT: "QUIT",

    /**
     * Player wants help
     *
     * Player-->Client-->Server
     */
    HELP: "HELP",

    /**
     * Server tells the client to prompt the player for some data
     *
     * Server-->Client-->Player
     */
    PROMPT: "P",

    /**
     * Server tells the client to prompt the player for some data
     *
     * Server-->Client-->Player
     */
    SYSTEM: "_",

    /**
     * Debug message, to be completely ignored in production
     *
     * Client-->Server
     *      or
     * Server-->Client-->Plater
     */
    DEBUG: "dbg",

    /**
     * Player sent colon-prefixed, an out-of-order, command
     *
     * Player-->Client-->Server
     */
    COLON: ":",
});

/**
 * Represents a message sent to/from client
 *
 * @property {string?} command
 * @property {any[]} args
 */
export class WebsocketMessage {
    /** @protected @type {any[]} The array that contains the message data */
    _data;

    /** @constant @readonly @type {string} The array that contains the message data */
    type;

    /** @constant @readonly @type {string?} the text payload (if any) of the decoded message */
    text;

    /**
     * @param {string} msgData the raw text data in the websocket message.
     */
    constructor(msgData) {
        if (typeof msgData !== "string") {
            throw new Error(
                "Could not create client message. Attempting to parse json, but data was not even a string, it was a " +
                    typeof msgData,
            );
        }

        let data;
        try {
            data = JSON.parse(msgData);
        } catch {
            throw new Error(
                `Could not create client message. Attempting to parse json, but data was invalid json: >>> ${msgData} <<<`,
            );
        }

        if (!Array.isArray(data)) {
            throw new Error(`Could not create client message. Excpected an array, but got a ${typeof this._data}`);
        }

        if (data.length < 1) {
            throw new Error(
                "Could not create client message. Excpected an array with at least 1 element, but got an empty one",
            );
        }

        this.type = mustBeString(data[0]);

        switch (this.type) {
            case MessageType.REPLY: // player ==> client ==> server
                this.text = mustBeString(data[1]);
                break;
            case MessageType.HELP: // player ==> client ==> server
                this.text = data[1] === undefined ? "" : mustBeString(data[1]).trim();
                break;
            case MessageType.COLON: // player ==> client ==> server
                this.command = mustMatch(data[1], /^[a-z0-9_]+$/);
                this.args = mustBe(data[2], "any[]");
                break;
            case MessageType.DEBUG: // server ==> client
            case MessageType.ERROR: // server ==> client ==> player
            case MessageType.QUIT: // player ==> client ==> server
            case MessageType.SYSTEM: // client <==> server
            case MessageType.PROMPT: // server ==> client ==> player
            case MessageType.TEXT: // server ==> client ==> player
                break;
            default:
                throw new Error(`Unknown message type: >>${typeof this.type}<<`);
        }
    }

    isQuit() {
        return this.type === MessageType.QUIT;
    }

    isHelp() {
        return this.type === MessageType.HELP;
    }

    isColon() {
        return this.type === MessageType.COLON;
    }

    isReply() {
        return this.type === MessageType.REPLY;
    }

    isSysMessage() {
        return this.type === MessageType.SYSTEM;
    }

    isDebug() {
        return this.type === MessageType.DEBUG;
    }
}

/**
 * Given a message type and some args, create a string that can be sent from the server to the client (or vise versa)
 *
 * @param {string} messageType
 * @param {...any} args
 */
export function formatMessage(messageType, ...args) {
    return JSON.stringify([messageType, ...args]);
}
