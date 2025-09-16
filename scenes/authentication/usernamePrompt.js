import { Player } from "../../models/player.js";
import { Prompt } from "../prompt.js";
import * as security from "../../utils/security.js";
import { gGame } from "../../models/globals.js";
import { Config } from "../../config.js";
import { AuthenticationScene } from "./authenticationScene.js";

/**
 * @class
 *
 * @property {AuthenticationScene} scene
 */
export class UsernamePrompt extends Prompt {
    //
    promptText = [
        "Please enter your username:", //
        "(((type *:create* if you want to create a new user)))", //
    ];

    //
    // When player types :help
    helpText = [
        "This is where you log in.",
        "If you don't already have a player profile on this server, you can type *:create* to create one",
    ];

    //
    // Let the client know that we're asking for a username
    promptOptions = { username: true };

    /** @returns {AuthenticationScene} */
    get scene() {
        return this._scene;
    }

    //
    // User replied to our prompt
    onReply(text) {
        //
        // do basic syntax checks on usernames
        if (!security.isUsernameSane(text)) {
            console.info("Someone entered insane username: '%s'", text);
            this.sendError("Incorrect username, try again");
            this.execute();
            return;
        }

        //
        // try and fetch the player object from the game
        const player = gGame.getPlayer(text);

        //
        // handle invalid username
        if (!player) {
            console.info("Someone entered incorrect username: '%s'", text);
            this.sendError("Incorrect username, try again");
            this.execute();
            return;
        }

        //
        // Tell daddy that we're done
        this.scene.usernameAccepted(player);
    }
}
