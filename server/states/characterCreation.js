import figlet from "figlet";
import { Session } from "../models/session.js";
import { ClientMessage } from "../utils/messages.js";
import { frameText } from "../utils/tui.js";
import { Config } from "../config.js";

export class CharacterCreationState {

    /**
     * @proteted
     * @type {(msg: ClientMessage) => }
     *
     * NOTE: Should this be a stack?
     */
    _dynamicMessageHandler;

    /**
    * @param {Session} session
    */
    constructor(session) {
        /** @type {Session} */
        this.session = session;
    }

    /**
     * We attach (and execute) the next state
     */
    onAttach() {
        const charCount = this.session.player.characters.size;

        //NOTE: could use async to optimize performance
        const createPartyLogo = frameText(
            figlet.textSync("Create Your Party"),
            { vPadding: 0, frameChars: "§=§§§§§§" },
        );

        this.session.sendMessage(createPartyLogo, { preformatted: true });

        this.session.sendMessage([
            "",
            `Current party size: ${charCount}`,
            `Max party size:     ${Config.maxPartySize}`,
        ]);

        const min = 1;
        const max = Config.maxPartySize - charCount;
        const prompt = [
            `Please enter an integer between ${min} - ${max}`,
            "((type *:help* to get more info about party size))",
        ];

        this.session.sendMessage(`You can create a party with ${min} - ${max} characters, how big should your party be?`);

        this.session.sendPrompt("integer", prompt);

        /** @param {ClientMessage} message */
        this._dynamicMessageHandler = (message) => {
            if (message.isHelpCommand()) {
                const mps = Config.maxPartySize; // short var name for easy doctype writing.
                this.session.sendMessage([
                    `Your party can consist of 1 to ${mps} characters.`,
                    "",
                    "* Large parties tend live longer",
                    `* If you have fewer than ${mps} characters, you can`,
                    "  hire extra characters in your local inn.",
                    "* large parties level slower because there are more",
                    "  characters to share the Experience Points",
                    "* The individual members of small parties get better",
                    "  loot because they don't have to share, but it",
                    "  a lot of skill to accumulate loot as fast a larger",
                    "  party can"
                ]);
                return;
            }

            if (!message.isIntegerResponse()) {
                this.session.sendError("You didn't enter a number");
                this.session.sendPrompt("integer", prompt);
                return;
            }

            const numCharactersToCreate = message.integer;

            if (numCharactersToCreate > max) {
                this.session.sendError("Number too high");
                this.session.sendPrompt("integer", prompt);
                return;
            }

            if (numCharactersToCreate < min) {
                this.session.sendError("Number too low");
                this.session.sendPrompt("integer", prompt);
                return;
            }

            this.session.sendMessage(`Let's create ${numCharactersToCreate} character(s) for you :)`);
            this._dynamicMessageHandler = undefined;
        };
    }

    /** @param {ClientMessage} message */
    onMessage(message) {
        if (this._dynamicMessageHandler) {
            this._dynamicMessageHandler(message);
            return;
        }
        this.session.sendMessage("pong", message.type);
    }
}
