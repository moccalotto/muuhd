import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import fs from "fs";
import { Session } from "./models/session.js";
import { GameSeeder } from "./seeders/gameSeeder.js";
import { Config } from "./config.js";
import { gGame } from "./models/globals.js";
import { AuthenticationScene } from "./scenes/authentication/authenticationScene.js";
import { MessageType, WebsocketMessage, formatMessage } from "./utils/messages.js";

//  __  __ _   _ ____    ____
// |  \/  | | | |  _ \  / ___|  ___ _ ____   _____ _ __
// | |\/| | | | | | | | \___ \ / _ \ '__\ \ / / _ \ '__|
// | |  | | |_| | |_| |  ___) |  __/ |   \ V /  __/ |
// |_|  |_|\___/|____/  |____/ \___|_|    \_/ \___|_|
// -----------------------------------------------------
class MudServer {
    constructor() {
        new GameSeeder().seed();
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
        console.info("New connection established");
        const session = new Session(websocket, gGame);
        if (Config.dev) {
            websocket.send(formatMessage(MessageType.SYSTEM, "dev", true));
        }

        //   ____ _     ___  ____  _____
        //  / ___| |   / _ \/ ___|| ____|
        // | |   | |  | | | \___ \|  _|
        // | |___| |__| |_| |___) | |___
        //  \____|_____\___/|____/|_____|
        //-------------------------------
        // Handle Socket Closing
        //----------------------
        websocket.on("close", () => {
            try {
                this.close(session);
            } catch (error) {
                console.error("Failed during closing of websocket", { error });
            }
        });

        websocket.on("message", (data) => {
            try {
                this.onMessage(session, data);
            } catch (error) {
                console.error(error, data.toString(), data);
                websocket.send(formatMessage(MessageType.CALAMITY, error));
                session.close();
            }
        });

        session.setScene(new AuthenticationScene(session));
    }

    //  _   _ _____ _____ ____      ____ _____  _    ____ _____
    // | | | |_   _|_   _|  _ \    / ___|_   _|/ \  |  _ \_   _|
    // | |_| | | |   | | | |_) |___\___ \ | | / _ \ | |_) || |
    // |  _  | | |   | | |  __/_____|__) || |/ ___ \|  _ < | |
    // |_| |_| |_|   |_| |_|       |____/ |_/_/   \_\_| \_\|_|
    //----------------------------------------------------------
    //
    //                   Start the server
    //
    //----------------------------------------------------------
    start() {
        /**
         * The file types we allow to be served.
         *
         * @type {Record<string,string>}
         */
        const contentTypes = {
            ".css": "text/css",
            ".html": "text/html",
            ".ico": "image/x-icon",
            ".map": "application/json",
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
        };

        /**
         * HTTP server for serving the MUDClient.
         *
         * NOTE: Consider moving to own file
         */
        const httpServer = http.createServer((req, res) => {
            let filePath = path.join("public", req.url === "/" ? "index.html" : req.url);
            const ext = path.extname(filePath);
            const contentType = contentTypes[ext];

            //
            // Check if the requested file has a legal file type.
            if (!contentType) {
                //
                // Invalid file, pretend it did not exist!
                res.writeHead(404);
                res.end(`File not found`);
                console.warn("Bad http request", req.url);
                return;
            }

            //
            // Check if the file exists.
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end(`File not found`);
                    console.warn("Bad http request", req.url);
                    return;
                }
                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
            });
        });

        /**
         * WebSocket Server for serving the MUDClient.
         *
         * NOTE: Consider moving to separate file
         */
        const websocketServer = new WebSocketServer({ server: httpServer });

        websocketServer.on("connection", (ws) => {
            this.onConnectionEstabished(ws);
        });

        httpServer.listen(Config.port, () => {
            console.info(`NUUHD server running on port ${Config.port}`);
        });
    }

    //  __  __ _____ ____ ____    _    ____ _____
    // |  \/  | ____/ ___/ ___|  / \  / ___| ____|
    // | |\/| |  _| \___ \___ \ / _ \| |  _|  _|
    // | |  | | |___ ___) |__) / ___ \ |_| | |___
    // |_|  |_|_____|____/____/_/   \_\____|_____|
    //--------------------------------------------
    /**
     * Handle incoming message
     * @param {Session} session
     * @param {WebSocket.RawData} data
     */
    onMessage(session, data) {
        //
        // Check if message too big
        if (data.byteLength > Config.maxIncomingMessageSize) {
            console.error("Message was too big!", Config.maxIncomingMessageSize, data.byteLength);
            session.calamity("batman");
            return;
        }

        console.debug("Incoming websocket message %s", data);

        //
        // Sanity check. Do we even have a scene to route the message to?
        if (!session.scene) {
            console.error("No scene!", data.toString());
            session.calamity("We received a message, but we're not in a state to handle it. Zark!");
            return;
        }

        const msgObj = new WebsocketMessage(data.toString());

        //
        // Route reply-messages to the current scene
        if (msgObj.isReply()) {
            return session.scene.onReply(msgObj);
        }

        //
        // Handle :help commands
        if (msgObj.isHelp()) {
            return session.scene.onHelp(msgObj);
        }

        //
        // Handle MessageType.QUIT messages. When the player types :quit
        if (msgObj.isQuit()) {
            session.scene.onQuit();
            session.close(0, "Closing the socket, graceful goodbye!");
            return;
        }

        //
        // Handle any text that starts with ":"  that isn't :help or :quit
        if (msgObj.isColon()) {
            return session.scene.onColon(msgObj);
        }

        //
        // Handle system messages
        if (msgObj.isSysMessage()) {
            console.debug("SYS message", msgObj);
            return;
        }

        //
        // Handle debug messages
        if (msgObj.isDebug()) {
            console.debug("DBG message", msgObj);
            return;
        }

        //
        // How did we end up down here?
        console.warn("Unknown message type: >>%s<<", msgObj.type, msgObj);
    }

    /**   ____ _     ___  ____  _____
     *   / ___| |   / _ \/ ___|| ____|
     *  | |   | |  | | | \___ \|  _|
     *  | |___| |__| |_| |___) | |___
     *   \____|_____\___/|____/|_____|
     * -------------------------------
     *  Handle Socket Closing
     * ----------------------
     *
     * @param {Session} session
     */
    close(session) {
        const playerName = session.player ? session.player.username : "[unauthenticated]";
        console.info(playerName + " disconnected");
        session.close();
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

console.info(`Environment: ${Config.env}`);

const mudserver = new MudServer(/* location of crypto key for saving games */);
mudserver.start();

//
//  ____ _____ _____ _   _   _     _           _       _
// / ___|_   _|  ___| | | | | |   (_)_ __   __| | __ _| |
// \___ \ | | | |_  | | | | | |   | | '_ \ / _` |/ _` | |
//  ___) || | |  _| | |_| | | |___| | | | | (_| | (_| |_|
// |____/ |_| |_|    \___/  |_____|_|_| |_|\__,_|\__,_(_)
//
if (Math.PI < 0 && WebSocket) {
    ("STFU Linda");
}
