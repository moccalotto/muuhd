import figlet from "figlet";
import { Session } from "../models/session.js";
import { WebsocketMessage } from "../utils/messages.js";
import { frameText } from "../utils/tui.js";
import { Config } from "../config.js";
import { State } from "./state.js";

export class PartyCreationState extends State {
    /**
     * @proteted
     * @type {(msg: WebsocketMessage) => }
     *
     * NOTE: Should this be a stack?
     */
    _dynamicMessageHandler;

    /** @param {Session} session */
    constructor(session) {
        /** @type {Session} */
        this.session = session;
    }

    /** We attach (and execute) the next state */
    onAttach() {
        const charCount = this.session.player.characters.size;

        //NOTE: could use async to optimize performance
        const createPartyLogo = frameText(figlet.textSync("Create Your Party"), {
            vPadding: 0,
            frameChars: "§=§§§§§§",
        });

        this.sendText(createPartyLogo, { preformatted: true });

        this.session.sendText([
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

        this.sendText(`You can create a party with ${min} - ${max} characters, how big should your party be?`);

        /** @param {WebsocketMessage} message */
        this.sendPrompt(prompt, (m) => this.receivePlayerCount(m));
    }

    /** @param {WebsocketMessage} m */
    receivePlayerCount(m) {
        if (m.isHelpRequest()) {
            return this.partySizeHelp();
        }

        if (!m.isInteger()) {
            this.sendError("You didn't enter an integer");
            this.sendPrompt(prompt, (m) => this.receivePlayerCount(m));
            return;
        }

        const numCharactersToCreate = Number(message.text);
        if (numCharactersToCreate > max) {
            this.sendError("Number too high");
            this.sendPrompt(prompt, (m) => this.receivePlayerCount(m));
            return;
        }

        if (numCharactersToCreate < min) {
            this.sendError("Number too low");
            this.sendPrompt(prompt, (m) => this.receivePlayerCount(m));
            return;
        }

        this.sendText(`Let's create ${numCharactersToCreate} character(s) for you :)`);
    }

    partySizeHelp() {
        this.sendText([
            `Your party can consist of 1 to ${mps} characters.`,
            "",
            "* Large parties tend live longer",
            `* If you have fewer than ${Config.maxPartySize} characters, you can`,
            "  hire extra characters in your local inn.",
            "* large parties level slower because there are more",
            "  characters to share the Experience Points",
            "* The individual members of small parties get better",
            "  loot because they don't have to share, but it",
            "  a lot of skill to accumulate loot as fast a larger",
            "  party can",
        ]);
        return;
    }
}
