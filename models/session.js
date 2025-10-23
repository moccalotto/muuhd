import { Player } from "./player.js";
import { mustBeString, mustBe } from "../utils/mustbe.js";
import { Scene } from "../scenes/scene.js";
import * as Messages from "../utils/messages.js";

/** @typedef {import("ws").WebSocket} WebSocket */

export class Session {
    /** @type {WebSocket} */
    _websocket;

    /** @protected @type {Scene} */
    _currentScene;

    /** @readonly @type {Scene} */
    get scene() {
        return this._currentScene;
    }

    /** @constant @type {Player} */
    _player;

    /**
     * The player that owns this session.
     * This value is undefined until the player has logged in,
     * and after that it is _constant_
     *
     * @constant @type {Player}
     */
    get player() {
        return this._player;
    }

    /**
     * @param {WebSocket} websocket
     */
    constructor(websocket) {
        this._websocket = websocket;
    }

    /**
     * @param {Scene} scene
     */
    setScene(scene) {
        console.debug("Changing scene", { scene: scene.constructor.name });
        if (!(scene instanceof Scene)) {
            throw new Error(`Expected instance of Scene, got a ${typeof scene}: >>${scene}<<`);
        }
        this._currentScene = scene;
        scene.execute(this);
    }

    /**
     * May only be called when the current player property has not yet been populated.
     * May only called once.
     *
     * @param {Player} player
     */
    setPlayer(player) {
        if (player instanceof Player) {
            this._player = player;
            return;
        }

        if (player === null) {
            this._player = null;
            return;
        }

        throw Error(`Can only set player to null or instance of Player, but received ${typeof player}`);
    }

    /** Close the session and websocket */
    close() {
        if (this._websocket) {
            this._websocket.close();
            this._websocket = null;
        }
        this._player = null;
        this._currentScene = null;
    }

    /**
     * Send a message via our websocket.
     *
     * @param {MessageType} messageType The message "header" (the first arg in the array sent to the client) holds the message type.
     * @param {...any} args
     */
    send(messageType, ...args) {
        if (!this._websocket) {
            console.error("Trying to send a message without a valid websocket", messageType, args);
            return;
        }
        this._websocket.send(Messages.formatMessage(messageType, ...args));
    }

    /**
     * @overload
     * @param {string|string[]} text The prompt message (the request to get the user to enter some info).
     * @param {string?} context
     */ /**
     * @overload
     * @param {string|string[]} text The prompt message (the request to get the user to enter some info).
     * @param {object?} options Any options for the text (client side text formatting, color-, font-, or style info, etc.).
     */
    sendPrompt(text, options) {
        options = options || {};

        if (typeof options === "string") {
            // if options is just a string, assume we meant to apply a context to the prompt
            options = { context: options };
        }

        this.send(
            Messages.PROMPT, // message type
            text, // TODO: prompt text must be string or an array of strings
            mustBe(options, "object"),
        );
    }

    /**
     * Send text to be displayed to the client
     *
     * @param {string|string[]} text Text to send. If array, each element will be displayed as its own line on the client side.
     * @param {object?} options message options for the client.
     */
    sendText(text, options = {}) {
        this.send(Messages.TEXT, text, options);
    }

    /** @param {string|string[]} errorMessage */
    sendError(errorMessage, options = { verbatim: true, error: true }) {
        this.send(Messages.ERROR, mustBeString(errorMessage), options);
    }

    /** @param {string|string[]} debugMessage */
    sendDebug(debugMessage, options = { verbatim: true, debug: true }) {
        this.send(Messages.DEBUG, debugMessage, options);
    }

    /**
     * Send a calamity text and then close the connection.
     * @param {string|string[]} errorMessage Text to send. If array, each element will be displayed as its own line on the client side.
     */
    calamity(errorMessage) {
        //
        // The client should know not to format calamaties anyway, but we add “preformatted” anyway
        console.info("CALAMITY", errorMessage);
        this.send(Messages.CALAMITY, errorMessage, { verbatim: true, calamity: true });
        this.close();
    }

    /**
     * @param {MessageType} systemMessageType
     * @param {any?} value
     */
    sendSystemMessage(systemMessageType, value = undefined) {
        this.send(Messages.SYSTEM, mustBeString(systemMessageType), value);
    }
}
