import { crackdown } from "./crackdown.js";

class MUDClient {
  //
  // Constructor
  constructor() {
    /** @type  {WebSocket} Our WebSocket */
    this.websocket = null;

    /** @type {boolean} Are we in development mode (decided by the server);
        this.dev = false;

        /** @type {string|null} The message type of the last thing we were asked. */
    this.replyType = null;

    /** @type {string|null} The #tag of the last  thing we were asked. */
    this.replyTag = null;

    /** @type {HTMLElement} The output "monitor" */
    this.output = document.getElementById("output");

    /** @type {HTMLElement} The input element */
    this.input = document.getElementById("input");

    /** @type {HTMLElement} The send/submit button */
    this.sendButton = document.getElementById("send");

    /** @type {HTMLElement} Status indicator */
    this.status = document.getElementById("status");

    // Passwords are crypted and salted before being sent to the server
    // This means that if ANY of these three parameters below change,
    // The server can no longer accept the passwords.
    /** @type {string} Hashing method to use for client-side password hashing */
    this.digest = "SHA-256";

    /** @type {string} Salt string to use for client-side password hashing */
    this.salt = "No salt, no shorts, no service";

    /** @type {string} Number of times the hashing should be done */
    this.rounds = 1000;

    /** @type {string} the username also salts the password, so the username must never change. */
    this.username = "";

    this.setupEventListeners();
    this.connect();
  }

  /** @param {string} password the password to be hashed */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    let data = encoder.encode(password + this.salt);

    for (let i = 0; i < this.rounds; i++) {
      const hashBuffer = await crypto.subtle.digest(this.digest, data);
      data = new Uint8Array(hashBuffer); // feed hash back in
    }

    // Convert final hash to hex
    const rawHash = Array.from(data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `KimsKrappyKryptoV1:${this.salt}:${this.rounds}:${this.digest}:${rawHash}`;
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    this.updateStatus("Connecting...", "connecting");

    try {
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.updateStatus("Connected", "connected");
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.input.focus();
        this.output.innerHTML = "";
      };

      this.websocket.onmessage = (event) => {
        console.debug(event);
        const data = JSON.parse(event.data);
        this.onMessage(data);
        this.input.focus();
      };

      this.websocket.onclose = () => {
        this.updateStatus("Disconnected", "disconnected");
        this.input.disabled = true;
        this.sendButton.disabled = true;

        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.websocket.onerror = (error) => {
        this.updateStatus("Connection Error", "error");
        this.writeToOutput("Connection error occurred. Retrying...", {
          class: "error",
        });
      };
    } catch (error) {
      console.error(error);
      this.updateStatus("Connection Failed", "error");
      setTimeout(() => this.connect(), 3000);
    }
  }

  setupEventListeners() {
    document.addEventListener("keypress", (e) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.input.focus();
      }
    });
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.onUserCommand();
      }
    });

    this.sendButton.addEventListener("click", () => {
      this.onUserCommand();
    });

    // Command history
    this.commandHistory = [];
    this.historyIndex = -1;

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.input.value =
            this.commandHistory[
              this.commandHistory.length - 1 - this.historyIndex
            ];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value =
            this.commandHistory[
              this.commandHistory.length - 1 - this.historyIndex
            ];
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.input.value = "";
        }
      }
    });
  }

  /**
   * Send a json-encoded message to the server via websocket.
   *
   * @param {messageType} string
   * @param {...any} rest
   */
  send(messageType, ...args) {
    if (args.length === 0) {
      this.websocket.send(JSON.stringify([messageType]));
      return;
    }

    this.websocket.send(JSON.stringify([messageType, ...args]));
  }

  //
  // Add a command to history so we can go back to previous commands with arrow keys.
  _addCommandToHistory(command) {
    //
    // we do not add usernames or passwords to history.
    if (this.replyType === "password" || this.replyType === "username") {
      return;
    }

    //
    // Adding empty commands makes no sense.
    // Why would the user navigate back through their history to
    // find and empty command when they can just press enter.
    if (command === "") {
      return;
    }

    //
    // Add to command our history
    // But not if the command was a password.
    this.historyIndex = -1;

    //
    // We do not add the same commands many times in a row.
    if (this.commandHistory[this.commandHistory.length - 1] === command) {
      return;
    }

    //
    // Add the command to the history stack
    this.commandHistory.push(command);
    if (this.commandHistory.length > 50) {
      this.commandHistory.shift();
    }
  }

  /**
   * User has entered a command
   */
  onUserCommand() {
    //
    // Trim user's input.
    const command = this.input.value.trim();
    this.input.value = "";
    this.input.type = "text";

    this._addCommandToHistory(command);

    // -- This is a sneaky command that should not be in production?
    //
    // In reality we want to use :clear, nor /clear
    // :clear would be sent to the server, and we ask if it's okay
    // to clear the screen right now, and only on a positive answer would we
    // allow the screen to be cleared. Maybe.....
    if (command === "/clear") {
      this.output.innerHTML = "";
      this.input.value = "";
      return;
    }

    //
    // Don't allow sending messages (for now)
    // Later on, prompts may give us the option to simply "press enter";
    if (!command) {
      console.debug("Cannot send empty message - YET");
      return;
    }

    //
    // Can't send a message without a websocket
    if (!(this.websocket && this.websocket.readyState === WebSocket.OPEN)) {
      return;
    }

    //
    // The server asked us for a password, so we send it.
    // But we hash it first, so we don't send our stuff
    // in the clear.
    if (this.replyType === "password") {
      this.hashPassword(command).then((pwHash) => {
        this.send("reply", "password", pwHash, this.replyTag);
        this.replyType = null;
        this.replyTag = null;
      });
      return;
    }

    //
    // When the player enters their username during the auth-phase,
    // keep the username in the pocket for later.
    if (this.replyType === "username") {
      this.username = command;
    }

    //
    // We add our own command to the output stream so the
    // player can see what they typed.
    this.writeToOutput("> " + command, { class: "input" });

    //
    // Handle certain-commands differently.
    const specialCommands = { ":quit": "quit", ":help": "help" };
    if (specialCommands[command]) {
      this.send(specialCommands[command]);
      return;
    }

    //
    // Handle replies
    // We want to be in a place where ALL messages are replies.
    // The game loop should always ask you for your next command,
    // even if it does so silently
    if (this.replyType) {
      //--------------------------------------------------
      // The server asked the player a question,
      // so we send the answer the way the server wants.
      //--------------------------------------------------
      this.send("reply", this.replyType, command, this.replyTag);
      this.replyType = null;
      this.replyTag = null;
      return;
    }

    //
    //-----------------------------------------------------
    // The player sends a text-based command to the server
    //-----------------------------------------------------
    //  ___                            _              _   _
    // |_ _|_ __ ___  _ __   ___  _ __| |_ __ _ _ __ | |_| |
    //  | || '_ ` _ \| '_ \ / _ \| '__| __/ _` | '_ \| __| |
    //  | || | | | | | |_) | (_) | |  | || (_| | | | | |_|_|
    // |___|_| |_| |_| .__/ \___/|_|   \__\__,_|_| |_|\__(_)
    //               |_|
    //
    // Aside from :help", ":quit", etc. we should not send
    // unsolicited messages to the server without being
    // prompted to do so.
    this.send("c", command);
  }

  //   ___        __  __
  //  / _ \ _ __ |  \/  | ___  ___ ___  __ _  __ _  ___
  // | | | | '_ \| |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \
  // | |_| | | | | |  | |  __/\__ \__ \ (_| | (_| |  __/
  //  \___/|_| |_|_|  |_|\___||___/___/\__,_|\__, |\___|
  //
  /** @param {any[]} data*/
  onMessage(data) {
    if (this.dev) {
      console.debug(data);
    }
    const messageType = data.shift();

    if (messageType === "dbg") {
      return this.handleDebugMessages(data);
    }

    if (messageType === "prompt") {
      return this.handlePromptMessage(data);
    }

    if (messageType === "e") {
      return this.handleErrorMessage(data);
    }

    if (messageType === "calamity") {
      return this.handleCalamityMessage(data);
    }

    if (messageType === "_") {
      return this.handleSystemMessages(data);
    }

    if (messageType === "m") {
      return this.handleTextMessages(data);
    }

    if (this.dev) {
      this.writeToOutput(
        `unknown message type: ${messageType}: ${JSON.stringify(data)}`,
        "debug",
      );
    }
    console.debug("unknown message type", data);
  }

  //
  // "m" => normal/standard message to be displayed to the user
  handleTextMessages(data) {
    const options = { ...data[1] }; // coerce options into an object.

    // normal text message to be shown to the player
    this.writeToOutput(data[0], options);
    return;
  }

  //
  // Debug messages let the server send data to be displayed on the player's screen
  // and also logged to the players browser's log.
  handleDebugMessages(data) {
    if (!this.dev) {
      return; // debug messages are thrown away if we're not in dev mode.
    }
    this.writeToOutput(data, { class: "debug", preformatted: true });
    console.debug("DBG", data);
  }

  //
  // "_" => system messages, not to be displayed
  handleSystemMessages(data) {
    if (data.length < 2) {
      console.debug("malformed system message", data);
      return;
    }

    console.debug("Incoming system message", data);

    /** @type {string} */
    const messageType = data.shift();

    switch (messageType) {
      case "dev":
        // This is a message that tells us that the server is in
        // "dev" mode, and that we should do the same.
        this.dev = data[0];
        this.status.textContent = "[DEV] " + this.status.textContent;
        break;
      case "salt":
        this.salt = data[0];
        console.debug("updating crypto salt", data[0]);
        break;
      default:
        console.debug("unknown system message", messageType, data);
    }

    // If we're in dev mode, we should output all system messages (in a shaded/faint fashion).
    if (this.dev) {
      this.writeToOutput(
        `system message: ${messageType} = ${JSON.stringify(data)}`,
        { class: "debug" },
      );
    }
    return;
  }

  //
  // "calamity" => lethal error. Close connection.
  // Consider hard refresh of page to reset all variables
  handleCalamityMessage(data) {
    //
    // We assume that calamity errors are pre-formatted, and we do not allow
    // any of our own formatting-shenanigans to interfere with the error message
    const options = { ...{ class: "error", preformatted: true }, ...data[1] };
    this.writeToOutput(data[0], options);
    return;
  }

  //
  // "e" => non-lethal errors
  handleErrorMessage(data) {
    const options = { ...{ class: "error" }, ...data[1] };
    this.writeToOutput(data[0], options);
    return;
  }

  //
  // The prompt is the most important message type,
  // it prompts us send a message back. We should not
  // send messages back to the server without being
  // prompted.
  // In fact, we should ALWAYS be in a state of just-having-been-prompted.
  handlePromptMessage(data) {
    let [replyType, promptText, replyTag, options = {}] = data;

    this.replyType = replyType;
    this.replyTag = replyTag;
    this.writeToOutput(promptText, { ...{ class: "prompt" }, ...options });

    // The server has asked for a password, so we set the
    // input type to password for safety reasons.
    if (replyType === "password") {
      this.input.type = "password";
    }

    return;
  }

  /**
   * Add output to the text.
   * @param {string} text
   * @param {object} options
   */
  writeToOutput(text, options = {}) {
    const el = document.createElement("span");

    if (typeof options.class === "string") {
      el.className = options.class;
    }

    // add end of line character "\n" unless
    // options.addEol = false is set explicitly
    const eol = options.addEol === false ? "" : "\n";

    if (options.preformatted) {
      el.textContent = text + eol;
      el.className += " " + "preformatted";
    } else {
      el.innerHTML = crackdown(text) + eol;
    }
    this.output.appendChild(el);
    this.output.scrollTop = this.output.scrollHeight;
  }

  /**
   * Update the status banner.
   *
   * @param {string} message
   * @param {string} className
   */
  updateStatus(message, className) {
    this.status.textContent = this.dev
      ? `[DEV] Status: ${message}`
      : `Status: ${message}`;
    this.status.className = className;
  }
}

// Initialize the MUD client when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new MUDClient();
});
