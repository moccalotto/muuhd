import WebSocket from "ws";
import { Game } from "./game.js";
import { Player } from "./player.js";
import { StateInterface } from "../states/interface.js";
import * as msg from "../utils/messages.js";
import figlet from "figlet";

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

  /** @type {Player} */
  _player;
  get player() {
    return this._player;
  }

  /** @param {Player} player */
  set player(player) {
    if (player instanceof Player) {
      this._player = player;
      return;
    }

    if (player === null) {
      this._player = null;
      return;
    }

    throw Error(
      `Can only set player to null or instance of Player, but received ${typeof player}`,
    );
  }

  /** @type {WebSocket} */
  _websocket;

  /**
   * @param {WebSocket} websocket
   * @param {Game} game
   */
  constructor(websocket, game) {
    this._websocket = websocket;
    this._game = game;
  }

  /** Close the session and websocket */
  close() {
    this._websocket.close();
    this._player = null;
  }

  /**
   * Send a message via our websocket.
   *
   * @param {string|number} messageType
   * @param {...any} args
   */
  send(messageType, ...args) {
    this._websocket.send(JSON.stringify([messageType, ...args]));
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
   * @param {string|string[]} message The prompting message (please enter your character's name)
   * @param {string} tag helps with message routing and handling.
   */
  sendPrompt(type, message, tag = "", ...args) {
    if (Array.isArray(message)) {
      message = message.join("\n");
    }
    this.send(msg.PROMPT, type, message, tag, ...args);
  }

  /** @param {string} message The error message to display to player */
  sendError(message, ...args) {
    this.send(msg.ERROR, message, ...args);
  }

  /** @param {string} message The error message to display to player */
  sendDebug(message, ...args) {
    this.send(msg.DEBUG, message, ...args);
  }

  /** @param {string} message The calamitous error to display to player */
  sendCalamity(message, ...args) {
    this.send(msg.CALAMITY, message, ...args);
  }

  sendSystemMessage(arg0, ...rest) {
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
