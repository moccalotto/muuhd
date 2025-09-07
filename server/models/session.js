import WebSocket from 'ws';
import { Game } from './game.js';
import { Player } from './player.js';
import { StateInterface } from './states/interface.js';
import * as msg from '../utils/messages.js';
import figlet from 'figlet';

export class Session {

    /** @protected @type {StateInterface} */
    _state;
    get state() {
        return this._state;
    }

    /** @protected @type {Game} */
    _game;
    get game() {
        return this._game;
    }

    /** @type Date */
    latestPing;

    /** @type {Player} */
    player;

    /** @type {WebSocket} */
    websocket;

    /**
     * @param {WebSocket} websocket
     * @param {Game} game
     */
    constructor(websocket, game) {
        this.websocket = websocket;
        this._game = game;
    }

    /**
     * Send a message via our websocket.
     *
     * @param {string|number} messageType
     * @param {...any} args
     */
    send(messageType, ...args) {
        this.websocket.send(JSON.stringify([messageType, ...args]));
    }

    sendFigletMessage(message) {
        console.debug("sendFigletMessage('%s')", message);
        this.sendMessage(figlet.textSync(message), { preformatted: true });
    }

    /** @param {string} message Message to display to player */
    sendMessage(message, ...args) {
        if (message.length === 0) {
            console.debug("sending a zero-length message, weird");
        }
        if (Array.isArray(message)) {
            message = message.join("\n");
        }
        this.send(msg.MESSAGE, message, ...args);
    }

    /**
     * @param {string} type prompt type (username, password, character name, etc.)
     * @param {string} message The prompting message (please enter your character's name)
     */
    sendPrompt(type, message,...args) {
        if (Array.isArray(message)) {
            message = message.join("\n");
        }
        this.send(msg.PROMPT, type, message,...args);
    }

    /** @param {string} message The error message to display to player */
    sendError(message,...args) {
        this.send(msg.ERROR, message, ...args);
    }

    /** @param {string} message The calamitous error to display to player */
    sendCalamity(message,...args) {
        this.send(msg.CALAMITY, message, ...args);
    }

    sendSystemMessage(arg0,...rest) {
        this.send(msg.SYSTEM, arg0, ...rest);
    }

    /**
     * @param {StateInterface} state
     */
    setState(state) {
        this._state = state;
        console.debug("changing state", state.constructor.name);
        if (typeof state.onAttach === "function") {
            state.onAttach();
        }
    }

}
