import { crackdown } from "../utils/crackdown.js";
import { parseArgs } from "../utils/parseArgs.js";
import { MessageType } from "../utils/messages.js";

/** Regex to validate if a :help [topic] command i entered correctly */
const helpRegex = /^:help(?:\s+(.*))?$/;

/** Regex to validate if a :<command> [args] was entered correctly */
const colonRegex = /^:([a-z0-9_]+)(?:\s+(.*?)\s*)?$/;

/**
 * The client that talks to the MUD Sever
 */
class MUDClient {
    //
    // Constructor
    constructor() {
        /** @type  {WebSocket} Our WebSocket */
        this.websocket = null;

        /** @type {boolean} Are we in development mode (decided by the server); */
        this.isDev = false;

        this.promptOptions = {};
        this.shouldReply = false;

        /** @type {HTMLElement} The output "monitor" */
        this.output = document.getElementById("output");

        /** @type {HTMLElement} The input element */
        this.input = document.getElementById("input");

        /** @type {HTMLElement} Status indicator */
        this.status = document.getElementById("status");

        // Passwords are crypted and salted before being sent to the server
        // This means that if ANY of these three parameters below change,
        // The server can no longer accept the passwords.
        /** @type {string} Hashing method to use for client-side password hashing */
        this.digest = "SHA-256";

        /** @type {string} Salt string to use for client-side password hashing */
        this.salt = "no_salt_no shorts_no_service";

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
                this.input.focus();
                this.output.innerHTML = "";
            };

            this.websocket.onmessage = (event) => {
                console.debug(event);
                const data = JSON.parse(event.data);
                this.onMessageReceived(data);
                this.input.focus();
            };

            this.websocket.onclose = () => {
                this.updateStatus("Disconnected", "disconnected");
                this.input.disabled = true;

                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.connect(), 3000);
            };

            this.websocket.onerror = (error) => {
                this.updateStatus("Connection Error", "error");
                this.writeToOutput("Connection error occurred. Retrying...", { class: "error" });
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
    }

    /**
     * Send a json-encoded message to the server via websocket.
     *
     * @param {messageType} string
     * @param {...any} rest
     */
    send(messageType, ...args) {
        console.log("sending", messageType, args);

        if (args.length === 0) {
            this.websocket.send(JSON.stringify([messageType]));
            return;
        }

        this.websocket.send(JSON.stringify([messageType, ...args]));
    }

    /**
     * User has entered a command
     */
    async onUserCommand() {
        /**  @type {string} */
        const inputText = this.input.value.trim(); // Trim user's input.

        this.input.value = ""; // Reset the input text field
        this.input.type = "text"; // Make sure it reverts to being a text input (as opposed to being a password input)

        // -- This is a sneaky command that should not be in production?
        //
        // In reality we want to use :clear, nor /clear
        // :clear would be sent to the server, and we ask if it's okay
        // to clear the screen right now, and only on a positive answer would we
        // allow the screen to be cleared. Maybe.....
        if (inputText === "/clear") {
            this.output.innerHTML = "";
            this.input.value = "";
            return;
        }

        //
        // Don't allow sending messages (for now)
        // Later on, prompts may give us the option to simply "press enter";
        if (!inputText) {
            console.debug("Cannot send empty message - YET");
            return;
        }

        //
        // Can't send a message without a websocket
        if (!(this.websocket && this.websocket.readyState === WebSocket.OPEN)) {
            return;
        }

        //
        // The quit command has its own message type
        if (inputText === ":quit") {
            this.send(MessageType.QUIT);
            this.echo(inputText);
            return;
        }

        //      _          _
        //  _  | |__   ___| |_ __
        // (_) | '_ \ / _ \ | '_ \
        //  _  | | | |  __/ | |_) |
        // (_) |_| |_|\___|_| .__/
        //                  |_|
        // ------------------------
        //
        // The quit command has its own message type
        let help = helpRegex.exec(inputText);
        if (help) {
            console.log("here");
            help[1] ? this.send(MshType.HELP, help[1].trim()) : this.send(MshType.HELP);
            this.echo(inputText);
            return;
        }

        //                                                    _
        //  _    ___ ___  _ __ ___  _ __ ___   __ _ _ __   __| |
        // (_)  / __/ _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` |
        //  _  | (_| (_) | | | | | | | | | | | (_| | | | | (_| |
        // (_)  \___\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|
        //------------------------------------------------------
        const colon = colonRegex.exec(inputText);
        if (colon) {
            const args = typeof colon[2] === "string" ? parseArgs(colon[2]) : [];
            this.send(MessageType.COLON, colon[1], args);
            this.echo(inputText);
            return;
        }

        //                 _
        //  _ __ ___ _ __ | |_   _
        // | '__/ _ \ '_ \| | | | |
        // | | |  __/ |_) | | |_| |
        // |_|  \___| .__/|_|\__, |
        //          |_|      |___/
        //-------------------------
        // We handle replies below
        //-------------------------

        //
        if (!this.shouldReply) {
            // the server is not ready for data!
            return;
        }

        // The server wants a password, let's hash it before sending it.
        if (this.promptOptions.password) {
            const pwHash = await this.hashPassword(inputText);
            this.send(MessageType.REPLY, pwHash);
            this.shouldReply = false;
            this.promptOptions = {};
            return;
        }

        //
        // The server wants a username, let's save it in case we need it.
        if (this.promptOptions.username) {
            this.username = inputText;
        }

        this.send(MessageType.REPLY, inputText);
        this.shouldReply = false;
        this.promptOptions = {};

        //
        // We add our own command to the output stream so the
        // player can see what they typed.
        this.echo(inputText);
        return;
    }

    //   ___        __  __
    //  / _ \ _ __ |  \/  | ___  ___ ___  __ _  __ _  ___
    // | | | | '_ \| |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \
    // | |_| | | | | |  | |  __/\__ \__ \ (_| | (_| |  __/
    //  \___/|_| |_|_|  |_|\___||___/___/\__,_|\__, |\___|
    //
    /** @param {any[]} data*/
    onMessageReceived(data) {
        if (this.isDev) {
            console.debug(data);
        }
        const messageType = data.shift();

        // prompt
        if (messageType === "P") {
            return this.handlePromptMessage(data);
        }

        // text message
        if (messageType === "T") {
            return this.handleTextMessages(data);
        }

        // error
        if (messageType === "E") {
            return this.handleErrorMessage(data);
        }

        // fatal error / calamity
        if (messageType === "CALAMITY") {
            return this.handleCalamityMessage(data);
        }

        // system message
        if (messageType === "_") {
            return this.handleSystemMessages(data);
        }
        // debug
        if (messageType === "dbg") {
            return this.handleDebugMessages(data);
        }

        if (this.isDev) {
            this.writeToOutput(`unknown message type: ${messageType}: ${JSON.stringify(data)}`, {
                class: "debug",
                verbatim: true,
            });
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
        if (!this.isDev) {
            return; // debug messages are thrown away if we're not in dev mode.
        }
        this.writeToOutput(data, { class: "debug", verbatim: true });
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
        const systemMessageType = data.shift();

        switch (systemMessageType) {
            case "username":
                this.username = data[0];
                break;
            case "dev":
                // This is a message that tells us that the server is in
                // "dev" mode, and that we should do the same.
                this.isDev = !!data[0];
                this.status.textContent = "[DEV] " + this.status.textContent;
                break;
            case "salt":
                this.salt = data[0];
                console.debug("updating crypto salt", data[0]);
                break;
            default:
                console.debug("unknown system message", systemMessageType, data);
        }

        // If we're in dev mode, we should output all system messages (in a shaded/faint fashion).
        if (this.isDev) {
            this.writeToOutput(`system message: ${systemMessageType} = ${JSON.stringify(data)}`, { class: "debug" });
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
        const options = { ...{ class: "error", verbatim: true }, ...data[1] };
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
        let [promptText, options = {}] = data;

        this.shouldReply = true;

        this.promptOptions = { ...{ class: "prompt" }, ...options };

        //
        this.writeToOutput(promptText, this.promptOptions);

        //
        // The server has asked for a password, so we set the
        // input type to password for safety reasons.
        if (options.password) {
            this.input.type = "password";
        }

        return;
    }

    echo(text) {
        this.writeToOutput(text, { verbatim: true, echo: true });
    }

    /**
     * Add output to the text.
     * @param {string} text
     * @param {object} options
     */
    writeToOutput(text, options = {}) {
        // tweak the data-formatting so we can iterate and create multiple elements
        const lines = Array.isArray(text) ? text : [text];

        for (const line of lines) {
            const element = document.createElement("div");

            if (options.verbatim) {
                element.textContent = line;
                element.className = "verbatim";
            } else {
                element.innerHTML = crackdown(line);
            }

            for (const cls of ["calamity", "error", "debug", "prompt", "echo"]) {
                if (options[cls]) {
                    element.classList.add(cls);
                }
            }

            this.output.appendChild(element);
            this.output.scrollTop = this.output.scrollHeight;
        }
    }

    /**
     * Update the status banner.
     *
     * @param {string} message
     * @param {string} className
     */
    updateStatus(message, className) {
        this.status.textContent = this.isDev ? `[DEV] Status: ${message}` : `Status: ${message}`;
        this.status.className = className;
    }
}

// Initialize the MUD client when the page loads
document.addEventListener("DOMContentLoaded", () => {
    new MUDClient();
});
