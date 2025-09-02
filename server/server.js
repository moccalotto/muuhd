const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Player
 *
 * @property WebSocket websocket
 */
class Player {
    /**
     * 
     * @param {String} name 
     * @param {WebSocket} websocket 
     */
    constructor(name, websocket) {
        this.name = name;
        this.websocket = websocket;
        this.currentRoom = 'town_square';
        this.health = 100;
        this.inventory = [];
        this.level = 1;
    }

    /***
     * Send a message back to the client via the websocket.
     *
     * @param {string} message
     */
    sendMessage(message) {
        if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'message',
                content: message
            }));
        }
    }

    sendPrompt() {
        this.sendMessage(`\n[${this.currentRoom}] > `);
    }
}

class Room {
    /**
     * 
     * @param {string} id 
     * @param {string} name 
     * @param {string} description 
     * @param {string[]} exits 
     */
    constructor(id, name, description, exits = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.exits = exits; // { north: 'room_id', south: 'room_id' }
        this.players = new Set();
        this.items = [];
        this.npcs = [];
    }

    /**
     * Add a player to the list of active players.
     * 
     * (an active player is a player that currently has an active web socketA)
     * 
     * @param {Player} player 
     */
    addPlayer(player) {
        this.players.add(player);
        this.broadcastToRoom(`${player.name} enters the room.`, player);
    }

    /**
     * Remove a player from the list of active players.
     * 
     * (an active player is a player that currently has an active web socketA)
     * 
     * @param {Player} player 
     */
    removePlayer(player) {
        this.players.delete(player);
        this.broadcastToRoom(`${player.name} leaves the room.`, player);
    }

    /**
     * Send a message to all other players in this room.
     * 
     * @param {string} message 
     * @param {Player} excludePlayer A single player to exclude from the broadcast
     */
    broadcastToRoom(message, excludePlayer = null) {
        // for (const player of this.players) {
        //     if (player !== excludePlayer) {
        //         player.sendMessage(message);
        //     }
        // }
        this.getPlayersExcept(excludePlayer).forEach((player) => {
            player.sendMessage(message);
        })
    }

    getPlayersExcept(excludePlayer) {
        return Array.from(this.players).filter(p => p !== excludePlayer);
    }
}

class MudServer {
    constructor() {
        this.players = new Map(); // websocket -> Player
        this.rooms = new Map();
        this.playersByName = new Map(); // name -> Player
        this.initializeRooms();
    }

    initializeRooms() {
        const townSquare = new Room(
            'town_square',
            'Town Square',
            'You are standing in the bustling town square. A fountain sits in the center, and cobblestone paths lead in all directions. The inn lies to the north, and a mysterious forest path leads east.',
            { north: 'inn', east: 'forest_entrance' }
        );

        const inn = new Room(
            'inn',
            'The Rusty Dragon Inn',
            'A cozy tavern filled with the aroma of hearty stew and ale. Adventurers gather around wooden tables, sharing tales of their exploits.',
            { south: 'town_square' }
        );

        const forestEntrance = new Room(
            'forest_entrance',
            'Forest Entrance',
            'The edge of a dark, mysterious forest. Ancient trees tower overhead, and you can hear strange sounds echoing from within.',
            { west: 'town_square', north: 'deep_forest' }
        );

        const deepForest = new Room(
            'deep_forest',
            'Deep Forest',
            'You are deep within the forest. Shadows dance between the trees, and you feel like you\'re being watched.',
            { south: 'forest_entrance' }
        );

        this.rooms.set('town_square', townSquare);
        this.rooms.set('inn', inn);
        this.rooms.set('forest_entrance', forestEntrance);
        this.rooms.set('deep_forest', deepForest);
    }

    /**
     * 
     * @param {WebSocket} ws 
     */
    handleConnection(ws) {
        console.log('New connection established');

        ws.send(JSON.stringify({
            type: 'message',
            content: 'Welcome to the WebSocket MUD!\nWhat is your character name?'
        }));

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(ws, message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });
    }

    /**
     * 
     * @param {WebSocket} ws 
     * @param {strings} message 
     * @returns 
     */
    handleMessage(ws, message) {
        const player = this.players.get(ws);

        if (!player) {
            // Player hasn't been created yet, expecting name
            const name = message.content.trim();
            if (name && !this.playersByName.has(name)) {
                this.createPlayer(ws, name);
            } else {
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
        this.playersByName.set(name, player);

        const startRoom = this.rooms.get(player.currentRoom);
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
        const playerList = Array.from(this.playersByName.keys());
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

    handleDisconnection(ws) {
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
            this.playersByName.delete(player.name);
        }
    }
}

// Create HTTP server for serving the client
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);

    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';

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
const wss = new WebSocket.Server({ server });
const mudServer = new MudServer();

wss.on('connection', (ws) => {
    mudServer.handleConnection(ws);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MUD server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
});
