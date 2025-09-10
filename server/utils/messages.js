/**
 * Very bad logic error. Player must quit game, refresh page, and log in again.
 *
 * Client-->Server
 *      or
 * Server-->Client-->Plater
 */
export const CALAMITY = "calamity";

/**
 * Tell recipient that an error has occurred
 *
 * Server-->Client-->Player
 */
export const ERROR = "e";

/**
 * Message to be displayed.
 *
 * Server-->Client-->Player
 */
export const MESSAGE = "m";

/**
 * Player has entered data, and sends it to server.
 *
 * Player-->Client-->Server
 */
export const REPLY = "reply";

/**
 * Player wants to quit.
 *
 * Player-->Client-->Server
 */
export const QUIT = "quit";

/**
 * Player wants help
 *
 * Player-->Client-->Server
 */
export const HELP = "help";

/**
 * Server tells the client to prompt the player for some data
 *
 * Server-->Client-->Player
 */
export const PROMPT = "prompt";

/**
 * Player has entered a command, and wants to do something.
 *
 * Player-->Client-->Server
 */
export const COMMAND = "c";

/**
 * Server tells the client to prompt the player for some data
 *
 * Server-->Client-->Player
 */
export const SYSTEM = "_";

/**
 * Debug message, to be completely ignored in production
 *
 * Client-->Server
 *      or
 * Server-->Client-->Plater
 */
export const DEBUG = "dbg";

/**
 * Represents a message sent from client to server.
 */
export class ClientMessage {
  /**
   * @protected
   * @type {any[]} _arr The array that contains the message data
   */
  _attr;

  /** The message type.
   *
   * One of the * constants from this document.
   *
   * @returns {string}
   */
  get type() {
    return this._attr[0];
  }

  /**
   * @param {string} msgData the raw text data in the websocket message.
   */
  constructor(msgData) {
    if (typeof msgData !== "string") {
      throw new Error(
        "Could not create client message. Attempting to parse json, but data was not even a string, it was a " +
          typeof msgData,
      );
      return;
    }

    try {
      this._attr = JSON.parse(msgData);
    } catch (_) {
      throw new Error(
        `Could not create client message. Attempting to parse json, but data was invalid json: >>> ${msgData} <<<`,
      );
    }

    if (!Array.isArray(this._attr)) {
      throw new Error(
        `Could not create client message. Excpected an array, but got a ${typeof this._attr}`,
      );
    }

    if (this._attr.length < 1) {
      throw new Error(
        "Could not create client message. Excpected an array with at least 1 element, but got an empty one",
      );
    }
  }
  hasCommand() {
    return this._attr.length > 1 && this._attr[0] === COMMAND;
  }

  /** Does this message contain a username-response from the client? */
  isUsernameResponse() {
    return (
      this._attr.length === 4 &&
      this._attr[0] === REPLY &&
      this._attr[1] === "username" &&
      typeof this._attr[2] === "string"
    );
  }

  /** Does this message contain a password-response from the client? */
  isPasswordResponse() {
    return (
      this._attr.length === 4 &&
      this._attr[0] === REPLY &&
      this._attr[1] === "password" &&
      typeof this._attr[2] === "string"
    );
  }

  /** @returns {boolean} does this message indicate the player wants to quit */
  isQuitCommand() {
    return this._attr[0] === QUIT;
  }

  isHelpCommand() {
    return this._attr[0] === HELP;
  }

  /** @returns {boolean} is this a debug message? */
  isDebug() {
    return this._attr.length === 2 && this._attr[0] === DEBUG;
  }

  isIntegerResponse() {
    return (
      this._attr.length === 4 &&
      this._attr[0] === REPLY &&
      this._attr[1] === "integer" &&
      (typeof this._attr[2] === "string" ||
        typeof this._attr[2] === "number") &&
      Number.isInteger(Number(this._attr[2]))
    );
  }

  /** @returns {number} integer */
  get integer() {
    if (!this.isIntegerResponse()) {
      return undefined;
    }

    return Number.parseInt(this._attr[2]);
  }

  /** @returns {string|false} Get the username stored in this message */
  get username() {
    return this.isUsernameResponse() ? this._attr[2] : false;
  }

  /** @returns {string|false} Get the password stored in this message */
  get password() {
    return this.isPasswordResponse() ? this._attr[2] : false;
  }

  /** @returns {string} */
  get command() {
    return this.hasCommand() ? this._attr[1] : false;
  }
}

/**
 * Given a message type and some args, create a string that can be sent from the server to the client (or vise versa)
 *
 * @param {string} messageType
 * @param {...any} args
 */
export function prepare(messageType, ...args) {
  return JSON.stringify([messageType, ...args]);
}
