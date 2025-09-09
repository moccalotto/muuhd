import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import fs from "fs";
import { Game } from "./models/game.js";
import * as msg from "./utils/messages.js";
import { Session } from "./models/session.js";
import { AuthState } from "./states/Auth.js";
import { GameSeeder } from "./seeders/gameSeeder.js";
import { Config } from "./config.js";

class MudServer {

    constructor() {
        /** @type {Game} */
        this.game = (new GameSeeder()).createGame();
    }

    //   ____ ___  _   _ _   _ _____ ____ _____ _____ ____
    //  / ___/ _ \| \ | | \ | | ____/ ___|_   _| ____|  _ \
    // | |  | | | |  \| |  \| |  _|| |     | | |  _| | | | |
    // | |__| |_| | |\  | |\  | |__| |___  | | | |___| |_| |
    //  \____\___/|_| \_|_| \_|_____\____| |_| |_____|____/
    //------------------------------------------------------
    // Handle New Socket Connections
    //------------------------------
    /** @param {WebSocket} websocket */
    onConnectionEstabished(websocket) {
        console.log("New connection established");
        const session = new Session(websocket, this.game);
        session.sendSystemMessage("dev", true)

        //   ____ _     ___  ____  _____
        //  / ___| |   / _ \/ ___|| ____|
        // | |   | |  | | | \___ \|  _|
        // | |___| |__| |_| |___) | |___
        //  \____|_____\___/|____/|_____|
        //-------------------------------
        // Handle Socket Closing
        //----------------------
        websocket.on("close", () => {
            if (!session.player) {
                console.info("A player without a session disconnected");
                return;
            }
            //-------------
            // TODO
            //-------------
            // Handle player logout (move the or hide their characters)
            //
            // Maybe session.onConnectionClosed() that calls session._state.onConnectionClosed()
            // Maybe this.setState(new ConnectionClosedState());
            // Maybe both ??
            console.log(`Player ${session.player.username} disconnected`);

        });

        //  __  __ _____ ____ ____    _    ____ _____
        // |  \/  | ____/ ___/ ___|  / \  / ___| ____|
        // | |\/| |  _| \___ \___ \ / _ \| |  _|  _|
        // | |  | | |___ ___) |__) / ___ \ |_| | |___
        // |_|  |_|_____|____/____/_/   \_\____|_____|
        //--------------------------------------------
        // HANDLE INCOMING MESSAGES
        //-------------------------
        websocket.on("message", (data) => {
            try {
                console.debug("incoming websocket message %s", data);

                if (!session.state) {
                    console.error("we received a message, but don't even have a state. Zark!");
                    websocket.send(msg.prepare(msg.ERROR, "Oh no! I don't know what to do!?"));
                    return;
                }

                const msgObj = new msg.ClientMessage(data.toString());

                if (msgObj.isQuitCommand()) {
                    //---------------------
                    // TODO TODO TODO TODO
                    //---------------------
                    // Set state = QuitState
                    //
                    websocket.send(msg.prepare(msg.MESSAGE, "The quitting quitter quits... Typical. Cya!"));
                    websocket.close();
                    return;
                }

                if (typeof session.state.onMessage !== "function") {
                    console.error("we received a message, but we're not i a State to receive it");
                    websocket.send(msg.prepare(msg.ERROR, "Oh no! I don't know what to do with that message."));
                    return;
                }
                session.state.onMessage(msgObj);
            } catch (error) {
                console.trace("received an invalid message (error: %s)", error, data.toString(), data);
                websocket.send(msg.prepare(
                    msg.CALAMITY,
                    error
                ));
            }
        });

        session.setState(new AuthState(session));
    }

    //  ____ _____  _    ____ _____
    // / ___|_   _|/ \  |  _ \_   _|
    // \___ \ | | / _ \ | |_) || |
    //  ___) || |/ ___ \|  _ < | |
    // |____/ |_/_/   \_\_| \_\|_|
    //-----------------------------
    // Start the server
    //-----------------
    start() {

        //
        // The file types we allow to be served.
        const contentTypes = {
            ".js": "application/javascript",
            ".css": "text/css",
            ".html": "text/html",
        };

        //
        // Create HTTP server for serving the client - Consider moving to own file
        const httpServer = http.createServer((req, res) => {
            let filePath = path.join("public", req.url === "/" ? "index.html" : req.url);
            const ext = path.extname(filePath);
            const contentType = contentTypes[ext];

            //
            // Check if the requested file has a legal file type.
            if (!contentType) {
                // Invalid file, pretend it did not exist!
                res.writeHead(404);
                res.end(`File not found`);
                console.log("Bad http request", req.url);
                return;
            }


            //
            // Check if the file exists.
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end(`File not found`);
                    console.log("Bad http request", req.url);
                    return;
                }
                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
            });
        });

        //
        // Create WebSocket server
        const websocketServer = new WebSocketServer({ server: httpServer });

        websocketServer.on("connection", (ws) => {
            this.onConnectionEstabished(ws);
        });

        console.info(`running environment: ${Config.env}`);
        httpServer.listen(Config.port, () => {
            console.log(`NUUHD server running on port ${Config.port}`);
            console.log(`WebSocket server ready for connections`);
        });
    }
}

//  __  __    _    ___ _   _
// |  \/  |  / \  |_ _| \ | |
// | |\/| | / _ \  | ||  \| |
// | |  | |/ ___ \ | || |\  |
// |_|  |_/_/   \_\___|_| \_|
//---------------------------
// Code entry point
//-----------------
const mudserver = new MudServer();
mudserver.start();
