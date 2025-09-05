import WebSocket from "ws";

/**
 * Player Account.
 *
 * 1. Contain persistent player account info.
 * 2. Contain the connection to the client machine if the player is currently playing the game.
 * 3. Contain session information.
 *
 * We can do this because we only allow a single websocket per player account.
 * You are not allowed to log in if a connection/socket is already open.
 *
 * We regularly ping and pong to ensure that stale connections are closed.
 *
 */
export class Player {
    /** @protected @type {string} unique username */
    _username;
    get username() {
        return this._username;
    }

    /** @protected @type {string} */
    _passwordHash;
    get passwordHash() {
        return this._passwordHash;
    }

    /** @protected @type {WebSocket} Player's current and only websocket. If undefined, the player is not logged in. */
    _websocket;
    get websocket() {
        return this._websocket;
    }

    /** @protected @type {Date} */
    _latestSocketReceived;

    constructor(username, passwordHash) {
        this._username = username;
    }

    /** @param {WebSocket} websocket */
    clientConnected(websocket) {
        this._websocket = websocket;
    }

    /***
     * Send a message back to the client via the WebSocket.
     *
     * @param {string} message
     * @return {boolean} success
     */
    _send(data) {
        if (!this._websocket) {
            console.error(
                "Trying to send a message to an uninitialized websocket",
                this,
                data,
            );
            return false;
        }
        if (this._websocket.readyState === WebSocket.OPEN) {
            this._websocket.send(JSON.stringify(data));
            return true;
        }
        if (this._websocket.readyState === WebSocket.CLOSED) {
            console.error(
                "Trying to send a message through a CLOSED websocket",
                this,
                data,
            );
            return false;
        }
        if (this._websocket.readyState === WebSocket.CLOSING) {
            console.error(
                "Trying to send a message through a CLOSING websocket",
                this,
                data,
            );
            return false;
        }
        if (this._websocket.readyState === WebSocket.CONNECTING) {
            console.error(
                "Trying to send a message through a CONNECTING (not yet open) websocket",
                this,
                data,
            );
            return false;
        }

        console.error(
            "Trying to send a message through a websocket with an UNKNOWN readyState (%d)",
            this.websocket.readyState,
            this,
            data,
        );
        return false;
    }

    sendPrompt() {
        this.sendMessage(`\n[${this.currentRoom}] > `);
    }
}
