import * as msg from "../../utils/messages.js";
import { Session } from "../session.js";

/**
 * Main game state
 *
 * It's here we listen for player commands.
 */
export class AwaitCommandsState {
    /**
    * @param {Session} session
    */
    constructor(session) {
        /** @type {Session} */
        this.session = session;
    }

    onAttach() {
        console.log("Session is entering the “main” state");
        this.session.sendMessage("Welcome to the game!");
    }

    /** @param {msg.ClientMessage} message */
    onMessage(message) {
        if (message.hasCommand()) {
            this.handleCommand(message);
        }
    }

    /** @param {msg.ClientMessage} message */
    handleCommand(message) {
        switch (message.command) {
            case "help":
                this.session.sendFigletMessage("HELP");
                this.session.sendMessage([
                    "---------------------------------------",
                    "  *:help*        this help screen",
                    "  *:quit*        quit the game",
                    "---------------------------------------",
                ]);
                break;
            case "quit":
                this.session.sendMessage("The quitting quitter quits, typical... Cya");
                this.session.websocket.close();
                break;
            default:
                this.session.sendMessage(`Unknown command: ${message.command}`);
        }
    }
}
