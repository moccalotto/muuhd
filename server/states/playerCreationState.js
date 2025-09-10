import { Session } from "../models/session.js";
import * as msg from "../utils/messages.js";
import * as security from "../utils/security.js";
import { Player } from "../models/player.js";
import { AuthState } from "./authState.js";
import { Config } from "../config.js";

const USERNAME_PROMPT =
  "Enter a valid username (4-20 characters, [a-z], [A-Z], [0-9], and underscore)";
const PASSWORD_PROMPT = "Enter a valid password";
const PASSWORD_PROMPT2 = "Enter your password again";
const ERROR_INSANE_PASSWORD = "Invalid password.";
const ERROR_INSANE_USERNAME =
  "Invalid username. It must be 4-20 characters, and may only contain [a-z], [A-Z], [0-9] and underscore";
const ERROR_INCORRECT_PASSWOD = "Incorrect password.";

/** @property {Session} session */
export class PlayerCreationState {
  /**
   * @proteted
   * @type {(msg: ClientMessage) => }
   *
   * Allows us to dynamically set which
   * method handles incoming messages.
   */
  _dynamicMessageHandler;

  /** @protected @type {Player} */
  _player;
  /** @protected @type {string} */
  _password;

  /**
   * @param {Session} session
   */
  constructor(session) {
    /** @type {Session} */
    this.session = session;
  }

  onAttach() {
    //
    // If there are too many players, stop allowing new players in.
    if (this.session.game._players.size >= Config.maxPlayers) {
      this.session.sendCalamity(
        "Server is full, no more players can be created",
      );
      this.session.close();
    }

    this.session.sendFigletMessage("New Player");
    this.session.sendPrompt("username", USERNAME_PROMPT);

    // our initial substate is to receive a username
    this.setMessageHandler(this.receiveUsername);
  }

  /** @param {msg.ClientMessage} message */
  onMessage(message) {
    this._dynamicMessageHandler(message);
  }

  /* @param {(msg: ClientMessage) => } handler */
  setMessageHandler(handler) {
    this._dynamicMessageHandler = handler;
  }

  /** @param {msg.ClientMessage} message */
  receiveUsername(message) {
    //
    // NOTE FOR ACCOUNT CREATION
    // Do adult-word checks, so we dont have Fucky_McFuckFace
    // https://www.npmjs.com/package/glin-profanity

    //
    // handle invalid message types
    if (!message.isUsernameResponse()) {
      this.session.sendError("Incorrect message type!");
      this.session.sendPrompt("username", USERNAME_PROMPT);
      return;
    }

    //
    // do basic syntax checks on usernames
    if (!security.isUsernameSane(message.username)) {
      this.session.sendError(ERROR_INSANE_USERNAME);
      this.session.sendPrompt("username", USERNAME_PROMPT);
      return;
    }

    const player = this.session.game.createPlayer(message.username);

    //
    // handle taken/occupied username
    if (player === false) {
      // Telling the user right away that the username is taken can
      // lead to data leeching. But fukkit.

      this.session.sendError(
        `Username _${message.username}_ was taken by another player.`,
      );
      this.session.sendPrompt("username", USERNAME_PROMPT);
      return;
    }

    this._player = player;

    this.session.sendSystemMessage("salt", player.salt);
    this.session.sendMessage(
      `Username _*${message.username}*_ is available, and I've reserved it for you :)`,
    );
    this.session.sendPrompt("password", PASSWORD_PROMPT);
    this.setMessageHandler(this.receivePassword);
  }

  /** @param {msg.ClientMessage} message */
  receivePassword(message) {
    //
    // handle invalid message types
    if (!message.isPasswordResponse()) {
      console.log("Invalid message type, expected password reply", message);
      this.session.sendError("Incorrect message type!");
      this.session.sendPrompt("password", PASSWORD_PROMPT);
      return;
    }

    //
    // Check that it's been hashed thoroughly before being sent here.
    if (!security.isPasswordSane(message.password)) {
      this.session.sendError(ERROR_INSANE_PASSWORD);
      this.session.sendPrompt("password", PASSWORD_PROMPT);
      return;
    }

    this._password = message.password; // it's relatively safe to store the PW here temporarily. The client already hashed the hell out of it.
    this.session.sendPrompt("password", PASSWORD_PROMPT2);

    this.setMessageHandler(this.receivePasswordConfirmation);
  }

  /** @param {msg.ClientMessage} memssage */
  receivePasswordConfirmation(message) {
    //
    // handle invalid message types
    if (!message.isPasswordResponse()) {
      console.log("Invalid message type, expected password reply", message);
      this.session.sendError("Incorrect message type!");
      this.session.sendPrompt("password", PASSWORD_PROMPT);
      this.setMessageHandler(this.receivePassword);
      return;
    }

    //
    // Handle mismatching passwords
    if (message.password !== this._password) {
      this.session.sendError(
        "Incorrect, you have to enter your password twice in a row successfully",
      );
      this.session.sendPrompt("password", PASSWORD_PROMPT);
      this.setMessageHandler(this.receivePassword);
      return;
    }

    //
    // Success!
    // Take the user to the login screen.
    this.session.sendMessage(
      "*_Success_* ✅ You will now be asked to log in again, sorry for that ;)",
    );
    this._player.setPasswordHash(security.generateHash(this._password));
    this.session.setState(new AuthState(this.session));
  }
}
