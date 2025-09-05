import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import fs from "fs";
import { Player } from "./models/player.js";
import { Game } from "./models/game.js";
import { ClientMessage, MSG_ERROR, MSG_MESSAGE, MSG_PROMPT, MSG_CALAMITY, } from "./utils/messages.js";

class Session {
    /** @type {boolean} */
    usernameProcessed = false;

    /** @type {boolean} */
    passwordProcessed = false;

    /** @type {boolean} */
    ready = false;

    /** @type Date */
    latestPing;

    /** @type {Player} */
    player;
}

class MudServer {
    /** @type {Map<WebSocket,Session>} */
    sessions = new Map();

    /** @type {Game} */
    game = new Game();

    /**
     * Send a message via a websocket.
     *
     * @param {WebSocket} websocket
     * @param {string|number} messageType
     * @param {...any} args
     */
    send(websocket, messageType, ...args) {
        // create array consisting of [messageType, args[0], args[1], ... ];
        websocket.send(JSON.stringify([messageType, ...args]));
    }

    /**
     * @param {WebSocket} websocket
     */
    onConnectionEstabished(websocket) {
        console.log("New connection established");
        this.sessions[websocket] = new Session();

        websocket.on("message", (data) => {
            this.onIncomingMessage(websocket, data);
        });
        websocket.on("close", () => {
            this.onConnectionClosed(websocket);
        });

        this.send(websocket, MSG_MESSAGE, "Welcome to MUUUHD", "big");
        this.send(websocket, MSG_PROMPT, "Please enter your username");
    }

    /**
     * @param {WebSocket} websocket
     * @param {strings} data
     */
    onIncomingMessage(websocket, data) {
        const session = this.sessions.get(websocket);

        if (!session) {
            console.error(
                "Incoming message from a client without a session!",
                data,
            );
            this.send(
                websocket,
                MSG_ERROR,
                "terminal",
                "You do not have an active session. Go away!",
            );
            websocket.close();
            return;
        }

        let message;

        try {
            message = new ClientMessage(data);
        } catch (error) {
            console.error("Bad websocket message", data, error);
            this.send(
                websocket,
                MSG_ERROR,
                "terminal",
                "You sent me a bad message! Goodbye...",
            );
            websocket.close();
            return;
        }

        if (!session.usernameProcessed) {
            //
            //----------------------------------------------------
            // We haven"t gotten a username yet, so we expect one.
            //----------------------------------------------------
            if (!message.hasUsername()) {
                console.error("User should have sent a “username” message, but sent something else instead");
                this.send(websocket, MSG_CALAMITY, "I expected you to send me a username, but you sent me something else instead. You bad! Goodbye...");

                // for now, just close the socket.
                websocket.close();
            }

            const player = this.game.players.get(message.username);

            if (!player) {
                //----------------------------------------------------
                // Invalid Username.
                //----------------------------------------------------
                console.log("Invalid username sent during login: %s", username);
                this.send(websocket, MSG_ERROR, "Invalid username");
                this.send(
                    websocket,
                    MSG_PROMPT,
                    "Please enter a valid username",
                );
            }

            // correct username, tentatively assign player to session
            // even though we have not yet validated the password.
            session.player = player;
            session.usernameProcessed = true;
            this.send(websocket, MSG_MESSAGE, "Username received");
            this.send(websocket, MSG_PROMPT, "Enter your password");

            return;
        }

        //
        //----------------------------------------------------
        // The player has entered a valid username, now expect
        // a password.
        //----------------------------------------------------
        if (!session.passwordProcessed) {
            if (!message.hasPassword) {
                console.error(
                    "Youser should have sent a “password” message, but sent this instead: %s",
                    message.type,
                );
            }
        }

        //
        //----------------------------------------------------
        // Process the player's commands
        //----------------------------------------------------
        if (message.isCommand()) {
            // switch case for commands.
            return;
        }

        console.error(
            "We have received a message we couldn't handle!!!",
            message,
        );
    }

    /**
     *
     * @param {WebSocket} websocket
     * @param {string} name
     */
    createPlayer(websocket, name) {
        const player = new Player(name, websocket);
        this.players.set(websocket, player);
        this.players.set(name, player);

        const startRoom = this.rooms.get("town_square");
        startRoom.addPlayer(player);

        player.sendMessage(`Welcome, ${name}! You have entered the world.`);
        this.showRoom(player);
    }

    /**
     * Called when a websocket connection is closing.
     *
     * @param {WebSocket} websocket
     */
    onConnectionClosed(websocket) {
        const session = this.sessions.get(websocket);

        if (session && session.player) {
            console.log(`Player ${player.username} disconnected`);

            //
            // Handle player logout (move the or hide their characters)
            // this.game.playerLoggedOut();
        } else {
            console.log("A player without a session disconnected");
        }

        this.sessions.delete(websocket);
    }
}

// Create HTTP server for serving the client
const httpServer = http.createServer((req, res) => {
    // let filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
    let filePath = path.join(
        "public",
        req.url === "/" ? "index.html" : req.url,
    );
    const ext = path.extname(filePath);

    const contentTypes = {
        ".js": "application/javascript",
        ".css": "text/css",
        ".html": "text/html",
    };

    if (!contentTypes[ext]) {
        // Invalid file, pretend it did not exist!
        res.writeHead(404);
        res.end(`File ${filePath} not found (invalid $ext)`);
        return;
    }

    const contentType = contentTypes[ext];

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end(`File ${filePath} . ${ext} not found (${err})`);
            return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
});

// Create WebSocket server
const websocketServer = new WebSocketServer({ server: httpServer });
const mudServer = new MudServer();

websocketServer.on("connection", (ws) => {
    mudServer.onConnectionEstabished(ws);
});

// websocketServer.on("connection", mudServer.onConnectionEstabished);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`MUD server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});
