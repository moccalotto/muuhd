import { Scene } from "../scene.js";

/**
 * Main game state
 *
 * It's here we listen for player commands.
 */
export class GameScene extends Scene {
    introText = "= Welcome";

    onReady() {
        //
        // Find out which state the player and their characters are in
        // Find out where we are
        // Re-route to the relevant scene if necessary.
        //
        // IF  player has stored state THEN
        //      restore it and resume [main flow]
        // END
        //
        // IF player has no characters THEN
        //      go to createCharacterScene
        // END
        //
        // set player's current location = Hovedstad
        // display the welcome to Hovedstad stuff, and
        // await the player's commands.
        //
        //
        // IDEA:
        // Does a player have a previous state?
        // The state that was on the previous session?
        //
        // If player does not have a previous session
        // then we start in the Adventurers Guild in the Hovedstad
        //
        this.showBasicPrompt(this.castle);
    }

    get castle() {
        return `
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
    }
}
