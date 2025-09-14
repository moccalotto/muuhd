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
        // IDEA:
        // Does a player have a previous state?
        // The state that was on the previous session?
        //
        // If player does not have a previous session
        // then we start in the Adventurers Guild in the Hovedstad
        //
        this.doPrompt("new commandprompt or whatever");
    }
}
