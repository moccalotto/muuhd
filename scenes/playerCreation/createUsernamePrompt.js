import { Prompt } from "../prompt.js";
import * as security from "../../utils/security.js";
import { gGame } from "../../models/globals.js";

/** @typedef {import("./playerCreationScene.js").PlayerCreationScene} PlayerCreationScene */

export class CreateUsernamePrompt extends Prompt {
    //
    promptText = [
        "Enter your username", //
        "((type *:help* for more info))", //
    ];

    //
    // When player types :help
    helpText = [
        "Your username.",
        "It's used, along with your password, when you log in.",
        "Other players can see it.",
        "Other players can use it to chat or trade with you",
        "It may only consist of the letters _a-z_, _A-Z_, _0-9_, and _underscore_",
    ];

    //
    // Let the client know that we're asking for a username
    promptOptions = { username: true };

    /**
     * @returns {PlayerCreationScene}
     */
    get scene() {
        return this._scene;
    }

    onReply(username) {
        //
        // do basic syntax checks on usernames
        if (!security.isUsernameSane(username)) {
            console.info("Someone entered insane username: '%s'", username);
            this.sendError("Incorrect username, try again.");
            this.execute();
            return;
        }

        //
        // try and fetch the player object from the game
        const player = gGame.getPlayerByUsername(username);

        //
        // handle invalid username
        if (player) {
            console.info("Someone tried to create a user with an occupied username: '%s'", username);
            this.sendError("Occupied, try something else");
            this.execute();
            return;
        }

        //
        // Tell daddy that we're done
        this.scene.usernameAccepted(username);
    }
}
