import figlet from "figlet";
import { Session } from "../models/session.js";
import { WebsocketMessage } from "../utils/messages.js";
import { frameText } from "../utils/tui.js";
import { Config } from "../config.js";
import { State } from "./state.js";

//  _____ ___  ____   ___       ____                          _     _____
// |_   _/ _ \|  _ \ / _ \ _   / ___|___  _ ____   _____ _ __| |_  |_   _|__
//   | || | | | | | | | | (_) | |   / _ \| '_ \ \ / / _ \ '__| __|   | |/ _ \
//   | || |_| | |_| | |_| |_  | |__| (_) | | | \ V /  __/ |  | |_    | | (_) |
//   |_| \___/|____/ \___/(_)  \____\___/|_| |_|\_/ \___|_|   \__|   |_|\___/
//
//  ____
// / ___|  ___ ___ _ __   ___  ___
// \___ \ / __/ _ \ '_ \ / _ \/ __|
//  ___) | (_|  __/ | | |  __/\__ \
// |____/ \___\___|_| |_|\___||___/

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
        super();
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

        this.session.sendText(["", `Current party size: ${charCount}`, `Max party size:     ${Config.maxPartySize}`]);
        const min = 1;
        const max = Config.maxPartySize - charCount;
        const prompt = [
            `Please enter an integer between ${min} - ${max}`,
            "((type *:help* to get more info about party size))",
        ];

        this.sendText(`You can create a party with ${min} - ${max} characters, how big should your party be?`);

        /** @param {WebsocketMessage} m */
        this.sendPrompt(prompt, (m) => this.receiveCharacterCount(m));
    }

    /** @param {WebsocketMessage} m */
    receiveCharacterCount(m) {
        if (m.isHelpRequest()) {
            return this.partySizeHelp();
        }

        if (!m.isInteger()) {
            this.sendError("You didn't enter an integer");
            this.sendPrompt(prompt, (m) => this.receiveCharacterCount(m));
            return;
        }

        const numCharactersToCreate = Number(m.text);
        if (numCharactersToCreate > Config.maxPartySize) {
            this.sendError("Number too high");
            this.sendPrompt(prompt, (m) => this.receiveCharacterCount(m));
            return;
        }

        if (numCharactersToCreate < 1) {
            this.sendError("Number too low");
            this.sendPrompt(prompt, (m) => this.receiveCharacterCount(m));
            return;
        }

        this.sendText(`Let's create ${numCharactersToCreate} character(s) for you :)`);
    }

    partySizeHelp() {
        this.sendText([
            `Your party can consist of 1 to ${Config.maxPartySize} characters.`,
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

if (Math.PI < 0 && Session && WebsocketMessage) {
    ("STFU Linda");
}
