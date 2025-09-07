class MUDClient {

    constructor() {
        /** @type  {WebSocket} ws */
        this.websocket = null;

        /** @type {boolean} Are we in development mode (decided by the server);
        this.dev = false;

        /**
         * The last thing we were asked.
         * @type {string|null}
         */
        this.serverExpects = null;
        this.output = document.getElementById("output");
        this.input = document.getElementById("input");
        this.sendButton = document.getElementById("send");
        this.status = document.getElementById("status");

        // Passwords are crypted and salted before being sent to the server
        // This means that if ANY of these three parameters below change,
        // The server can no longer accept the passwords.
        this.digest = "SHA-256";
        this.salt = "V1_Kims_Krappy_Krypto";
        this.rounds = 1000;

        this.username = ""; // the username also salts the password, so the username must never change.

        this.setupEventListeners();
        this.connect();
    }
    async hashPassword(password) {
        const encoder = new TextEncoder();
        let data = encoder.encode(password + this.salt + this.username);

        for (let i = 0; i < this.rounds; i++) {
            const hashBuffer = await crypto.subtle.digest(this.digest, data);
            data = new Uint8Array(hashBuffer); // feed hash back in
        }

        // Convert final hash to hex
        const rawHash = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');

        return `${this.salt}:${this.rounds}:${this.digest}:${rawHash}`;
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
                this.output.innerHTML = '';
            };

            this.websocket.onmessage = (event) => {
                console.log(event);
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
                this.appendOutput("Connection error occurred. Retrying...", { class: "error" });
            };
        } catch (error) {
            console.error(error);
            this.updateStatus("Connection Failed", "error");
            setTimeout(() => this.connect(), 3000);
        }
    }

    setupEventListeners() {
        this.input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.sendMessage();
            }
        });

        this.sendButton.addEventListener("click", () => {
            this.sendMessage();
        });

        // Command history
        this.commandHistory = [];
        this.historyIndex = -1;

        this.input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
                } else if (this.historyIndex === 0) {
                    this.historyIndex = -1;
                    this.input.value = "";
                }
            }
        });
    }

    sendMessage() {
        const message = this.input.value.trim();

        // -- This is a sneaky command that should not be in production?
        //
        // In reality we want to use :clear, nor /clear
        // :clear would be sent to the server, and we ask if it's okay
        // to clear the screen right now, and only on a positive answer would we
        // allow the screen to be cleared. Maybe.....
        if (message === "/clear") {
            this.output.innerHTML = "";
            this.input.value = "";
            return;
        }

        if (message && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            // Add to command history
            if (this.commandHistory[this.commandHistory.length - 1] !== message) {
                this.commandHistory.push(message);
                if (this.commandHistory.length > 50) {
                    this.commandHistory.shift();
                }
            }
            this.historyIndex = -1;
            this.input.value = "";
            this.input.type = "text";

            if (this.serverExpects === "password") {
                //--------------------------------------------------
                // The server asked us for a password, so we send it.
                // But we hash it first, so we don't send our stuff
                // in the clear.
                //--------------------------------------------------
                this.hashPassword(message).then((pwHash) => {
                    this.websocket.send(JSON.stringify(["reply", "password", pwHash]))
                    this.serverExpects = null;
                });
                return;
            }

            this.appendOutput("> " + message, { class: "input" });

            if (message === ":quit") {
                this.websocket.send(JSON.stringify(["quit"]));
                return;
            }
            if (message === ":help") {
                this.websocket.send(JSON.stringify(["help"]));
                return;
            }

            if (this.serverExpects === "username") {
                //--------------------------------------------------
                // The server asked us for a user, so we send it.
                // We also store the username for later
                //--------------------------------------------------
                this.username = message;
                this.websocket.send(JSON.stringify(["reply", "username", message]))
                this.serverExpects = null;
                return;

            }

            if (this.serverExpects) {
                //--------------------------------------------------
                // The server asked the player a question,
                // so we send the answer the way the server wants.
                //--------------------------------------------------
                this.websocket.send(JSON.stringify(["reply", this.serverExpects, message]))
                this.serverExpects = null;
                return;
            }

            //
            //-----------------------------------------------------
            // The player sends a text-based command to the server
            //-----------------------------------------------------
            this.websocket.send(JSON.stringify(["c", message]));

        }
    }

    //   ___        __  __
    //  / _ \ _ __ |  \/  | ___  ___ ___  __ _  __ _  ___
    // | | | | '_ \| |\/| |/ _ \/ __/ __|/ _` |/ _` |/ _ \
    // | |_| | | | | |  | |  __/\__ \__ \ (_| | (_| |  __/
    //  \___/|_| |_|_|  |_|\___||___/___/\__,_|\__, |\___|
    // 
    /** @param {any[]} data*/
    onMessage(data) {
        console.log(data);
        switch (data[0]) {
            case "prompt":
                this.serverExpects = data[1];
                this.appendOutput(data[2], { class: "prompt" });
                if (this.serverExpects === "password") {
                    this.input.type = "password";
                }
                break;
            case "e":   // error
                this.appendOutput(data[1], { class: "error" });
                break;
            case "calamity":
                this.appendOutput(data[1], { class: "error" });
                break;
            case "_":  // system messages, not to be displayed
                if (data.length === 3 && data[1] === "dev") {
                    this.dev = data[2];
                }

                if (this.dev) {
                    this.appendOutput(`system message: ${data[1]} = ${JSON.stringify(data[2])}`, { class: "debug" });
                }
                break;
            case "m":
                // normal text message to be shown to the player
                // formatting magic is allowed.
                //
                // TODO: styling, font size, etc.
                const args = typeof (data[2] === "object") ? data[2] : {};
                this.appendOutput(data[1], args);
                break;

            this.appendOutput(data[1], {preformatted:true}) 
            default:
                if (this.dev) {
                    msgType = data.shift();
                    this.appendOutput(`unknown message type: ${msgType}: ${JSON.stringify(data)}`, "debug");
                }
                console.log("unknown message type", data);
        }
    }

    /**
     * Add output to the text.
     * @param {string} text
     * @param {object} options
     */
    appendOutput(text, options = {}) {
        const el = document.createElement("span");

        if (typeof options.class === "string") {
            el.className = options.class;
        }


        // Enter prompt answers on the same line as the prompt?
        // if (className !== "prompt") {
        //     el.textContent = text + "\n";
        // } else {
        //     el.textContent = text + " ";
        // }

        // add end of line character "\n" unless
        // options.addEol = false is set explicitly
        const eol = options.addEol === false ? "" : "\n";

        if (options.preformatted) {
            el.textContent = text + eol;
        } else {
            el.innerHTML = parseCrackdown(text) + eol;
        }
        this.output.appendChild(el);
        this.output.scrollTop = this.output.scrollHeight;
    }

    updateStatus(message, className) {
        this.status.textContent = `Status: ${message}`;
        this.status.className = className;
    }
}

// Initialize the MUD client when the page loads
document.addEventListener("DOMContentLoaded", () => {
    new MUDClient();
});

function parseCrackdown(text) {
    console.log("starting crack parsing");
    console.log(text);
    return text.replace(/[&<>"'`]/g, (c) => {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case '\'': return '&#039;';
            case '`': return '&#096;';
            default: return c;
        }
    })
        .replace(/---(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])---/g, '<span class="strike">$1</span>') // line-through
        .replace(/___(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])___/g, '<span class="underline">$1</span>')    // underline
        .replace(/_(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])_/g, '<span class="italic">$1</span>')    // italic
        .replace(/\*(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\*/g, '<span class="bold">$1</span>')  // bold
        .replace(/\.{3}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\.{3}/g, '<span class="undercurl">$1</span>')  // undercurl
        .replace(/\({3}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\){3}/g, '<span class="faint">($1)</span>')  // faint with parentheses
        .replace(/\({2}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\){2}/g, '<span class="faint">$1</span>')  // faint with parentheses
        ;

    console.log("crack output", text);

    return text;

}
