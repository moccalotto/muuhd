import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import fs from "fs";
import { Player } from "./models/player.js";
import { Game } from "./models/game.js";


/**
 * Parse a string with json-encoded data without throwing exceptions.
 *
 * @param {string} data
 * @return {any}
 */
function parseJson(data) {
    if (typeof data !== "string") {
        console.error("Attempting to parse json, but data was not even a string", data);
        return;
    }

    try {
        return JSON.parse(data)
    } catch (error) {
        console.error('Error parsing data as json:', error, data);
    }
}

class MudServer {
    constructor() {
        this.game = new Game();
    }

    /**
     * @param {WebSocket} ws 
     */
    onConnectionEstabished(ws) {
        console.log('New connection established');

        ws.send(JSON.stringify(
            ["m", "Welcome to the WebSocket MUD!\nWhat is your username name?"]
        ));
        ws.on('message', (data) => {
            this.onIncomingMessage(parseJson(data));
        });

        ws.on('close', () => {
            this.onConnectionClosed(ws);
        });
    }

    /**
     * @param {WebSocket} ws 
     * @param {strings} message 
     * @returns 
     */
    onIncomingMessage(ws, message) {
        const player = this.players.get(ws);

        if (!player) {
            // Player hasn't been created yet, expecting name
            const name = message.content.trim();
            if (name && !this.players.has(name)) {
                this.createPlayer(ws, name);
            } else {
                /**
                 * @todo: send an array instead of object.
                 * element 1 is the type
                 * element 2 is the content
                 * element 3+ are expansions
                 */
                ws.send(JSON.stringify({
                    type: 'message',
                    content: 'Invalid name or name already taken. Please choose another:'
                }));
            }
            return;
        }

        // Process command
        this.processCommand(player, message.content.trim());
    }

    /**
     * 
     * @param {WebSocket} ws 
     * @param {string} name 
     */
    createPlayer(ws, name) {
        const player = new Player(name, ws);
        this.players.set(ws, player);
        this.players.set(name, player);

        const startRoom = this.rooms.get("town_square");
        startRoom.addPlayer(player);

        player.sendMessage(`Welcome, ${name}! You have entered the world.`);
        this.showRoom(player);
    }

    /**
     * 
     * @param {Player} player 
     * @param {string} input 
     */
    processCommand(player, input) {
        const args = input.toLowerCase().split(' ');
        const command = args[0];

        switch (command) {
            case 'look':
            case 'l':
                this.showRoom(player);
                break;

            case 'go':
            case 'move':
                if (args[1]) {
                    this.movePlayer(player, args[1]);
                } else {
                    player.sendMessage('Go where?');
                }
                break;

            case 'north':
            case 'n':
                this.movePlayer(player, 'north');
                break;

            case 'south':
            case 's':
                this.movePlayer(player, 'south');
                break;

            case 'east':
            case 'e':
                this.movePlayer(player, 'east');
                break;

            case 'west':
            case 'w':
                this.movePlayer(player, 'west');
                break;

            case 'say':
                if (args.length > 1) {
                    const message = args.slice(1).join(' ');
                    this.sayToRoom(player, message);
                } else {
                    player.sendMessage('Say what?');
                }
                break;

            case 'who':
                this.showOnlinePlayers(player);
                break;

            case 'inventory':
            case 'inv':
                this.showInventory(player);
                break;

            case 'help':
                this.showHelp(player);
                break;

            case 'quit':
                player.sendMessage('Goodbye!');
                player.websocket.close();
                break;

            default:
                player.sendMessage(`Unknown command: ${command}. Type 'help' for available commands.`);
        }

        player.sendPrompt();
    }

    /**
     * 
     * @param {Player} player 
     * @param {*} direction 
     * @returns 
     */
    movePlayer(player, direction) {
        const currentRoom = this.rooms.get(player.currentRoom);
        const newRoomId = currentRoom.exits[direction];

        if (!newRoomId) {
            player.sendMessage('You cannot go that way.');
            return;
        }

        const newRoom = this.rooms.get(newRoomId);
        if (!newRoom) {
            player.sendMessage('That area is not accessible right now.');
            return;
        }

        // Remove from current room and add to new room
        currentRoom.removePlayer(player);
        player.currentRoom = newRoomId;
        newRoom.addPlayer(player);

        this.showRoom(player);
    }

    showRoom(player) {
        const room = this.rooms.get(player.currentRoom);
        let description = `\n=== ${room.name} ===\n`;
        description += `${room.description}\n`;

        // Show exits
        const exits = Object.keys(room.exits);
        if (exits.length > 0) {
            description += `\nExits: ${exits.join(', ')}`;
        }

        // Show other players
        const otherPlayers = room.getPlayersExcept(player);
        if (otherPlayers.length > 0) {
            description += `\nPlayers here: ${otherPlayers.map(p => p.name).join(', ')}`;
        }

        player.sendMessage(description);
    }

    sayToRoom(player, message) {
        const room = this.rooms.get(player.currentRoom);
        const fullMessage = `${player.name} says: "${message}"`;

        room.broadcastToRoom(fullMessage, player);
        player.sendMessage(`You say: "${message}"`);
    }

    showOnlinePlayers(player) {
        const playerList = Array.from(this.players.keys());
        player.sendMessage(`Online players (${playerList.length}): ${playerList.join(', ')}`);
    }

    showInventory(player) {
        if (player.inventory.length === 0) {
            player.sendMessage('Your inventory is empty.');
        } else {
            player.sendMessage(`Inventory: ${player.inventory.join(', ')}`);
        }
    }

    showHelp(player) {
        const helpText = `
Available Commands:
- look, l: Look around the current room
- go <direction>, <direction>: Move in a direction (north, south, east, west, n, s, e, w)
- say <message>: Say something to other players in the room
- who: See who else is online
- inventory, inv: Check your inventory
- help: Show this help message
- quit: Leave the game
        `;
        player.sendMessage(helpText);
    }

    /**
     * Called when a websocket connection is closing.
     */
    onConnectionClosed(ws) {
        const player = this.players.get(ws);
        if (player) {
            console.log(`Player ${player.name} disconnected`);

            // Remove from room
            const room = this.rooms.get(player.currentRoom);
            if (room) {
                room.removePlayer(player);
            }

            // Clean up references
            this.players.delete(ws);
            this.players.delete(player.name);
        }
    }
}

// Create HTTP server for serving the client
const server = http.createServer((req, res) => {
    // let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    let filePath = path.join('public', req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);

    const contentTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
    };

    if (!contentTypes[ext]) {
        // Invalid file, pretend it did not exist!
        res.writeHead(404);
        res.end('File not found');
        return;
    }

    const contentType = contentTypes[ext];

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });
const mudServer = new MudServer();

wss.on('connection', (ws) => {
    mudServer.onConnectionEstabished(ws);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MUD server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});
