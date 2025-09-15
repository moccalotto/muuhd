import { Session } from "../models/session.js";

const castle = `
                                                ▄
                                                █▐▀▀▀▌▄
                                                █      ▐▀▀▀▌▌▓▌
                                                █ ▄▄      ▄▄▀
                                                █    ▐▀▀▀▀
                                               ▄█▄
                                              ▓▀ ▀▌
                                            ▓▀     ▓▄
                                          ▄▓        ▐▓
                                        ▄▓            ▀▌
                                   ▓▀▀▀▀▀▓   ▓▀▀▀▀▓   ▐█▀▀▀▀▓
                                   █     █   █    ▓░  ▓▌    ▓░
                                   █     ▀▀▀▀▀    ▀▀▀▀▀     ▓░
                                   ▓▒                       ▓░
                                   ▀▓▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
                                     ▐▌                   █
         ▓▀▀▀▀█  ▐█▀▀▀█  ▐█▀▀▀▓▒     ▐▌                   █     ▐▓▀▀▀▓▒  ▓▀▀▀▓▒  █▀▀▀▀▓
         █    █  ▐▌   █  ▐▌   ▓▒     ▐▌       ▐██░        █     ▐█   ▓▄  █   ▐▌  █   ▐█
         ▓░   ▐▀▀▀    ▐▀▀▀    █░     ▐▌       ▓██▌        █     ▐█    ▀▀▀▀    ▀▀▀    ▐▌
         ▓▒                   █      ▐▌       ▀██▌        █      █                   ▐▌
          ▀▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▓▀      ▐▌                   █      ▀▌▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▓
           ▐▌               █        ▐▌                   █        █               ▐▌
           ▐▌               █        ▐▌                   █        █               ▐▌
           ▐▌      ▓▌       █▀▀▀▀▀█  ▐▌▐▌▀▀▀▀█    ▓▀▀▀▀▓▄ █  █▀▀▀▀▀█       ▓▌      ▐▌
           ▓▌      ██▌      █     █  ▓▌▓▒    █    █    ▐▌ █  █     █      ▓██      ▐▓
           ▓▒     ▐██▌      █                                      █      ▓██░     ▐█
           ▓       ▐▐       █                                      █       ▐▐       █
           █                █                                      █                █
           █                █                  ▄▄▄                 █                █
           █                █              ▄▀▀    ▀▀▓▄             █                █
           █                █            ▄▌          ▀▓            █                █
          ▐█                █           ▓▀            ▐█           █                ▓▒
          ▐▌                █          ▐▓              ▐▌         ▐█                ▓▒
          ▐▌                █          █                █         ▐█                ▐▌
          ▐▌                ▓░         █                █         ▐▌                ▐▌
          ▓▒                ▓░         █                ▓▒        ▐▌                ▐▓
          ▓░                ▓░        ▐▌                ▀▌        ▐▌                ▐█
          ▀▌▄▄              ▓▄▄       ▐█                ▓▌     ▄▄▄▐▌              ▄▄▄▀
                ▐▐▐▀▀▀▀▐▐▐                                            ▐▐▀▀▀▀▀▀▐▐
`;

/** @interface */
export class JustLoggedInState {
    /** @param {Session} session */
    constructor(session) {
        /** @type {Session} */
        this.session = session;
    }

    // Show welcome screen
    onAttach() {
        this.session.sendText(castle);
        this.session.sendText(["", "Welcome", "", "You can type “:quit” at any time to quit the game", ""]);

        //
        // Check if we need to create characters for the player
        if (this.session.player.characters.size === 0) {
            this.session.sendText("You haven't got any characters, so let's make some\n\n");
            this.session.setState(new PartyCreationState(this.session));
            return;
        }

        for (const character of this.session.player.characters) {
            this.session.sendText(`Character: ${character.name} (${character.foundation})`);
        }

        this.session.setState(new AwaitCommandsState(this.session));
    }
}
