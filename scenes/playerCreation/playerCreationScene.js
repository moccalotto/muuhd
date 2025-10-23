import { Config } from "../../config.js";
import { Prompt } from "../prompt.js";
import { Scene } from "../scene.js";
import { Security } from "../../utils/security.js";
import { gGame } from "../../models/globals.js";
import { AuthenticationScene } from "../authentication/authenticationScene.js";

const MAX_PASSWORD_ATTEMPTS = 3;

export class PlayerCreationScene extends Scene {
    intro = "= Create Player";

    /** @protected @type {Player} */
    player;

    /** @protected @type {string} */
    password;

    onReady() {
        //
        // If there are too many players, stop allowing new players in.
        if (gGame.players.size >= Config.maxPlayers) {
            this.session.calamity("Server is full, no more players can be created");
        }

        this.showPrompt(new UsernamePrompt(this));
    }

    /**
     * Called when the player has entered a valid and available username.
     *
     * @param {string} username
     */
    usernameAccepted(username) {
        const player = gGame.createPlayer(username);
        this.player = player;

        this.session.sendSystemMessage("salt", player.salt);

        this.session.sendText(`Username _*${username}*_ has been reserved for you`);

        this.show(PasswordPrompt);
    }

    /**
     *
     * Called when the player has entered a password and confirmed it.
     *
     * @param {string} password
     */
    passwordAccepted(password) {
        this.password = password;
        this.player.setPasswordHash(Security.generateHash(this.password));
        this.session.sendText("*_Success_* ✅ You will now be asked to log in again, sorry about that ;)");
        this.session.setScene(new AuthenticationScene(this.session));
    }
}

//  _   _
// | | | |___  ___ _ __ _ __   __ _ _ __ ___   ___
// | | | / __|/ _ \ '__| '_ \ / _` | '_ ` _ \ / _ \
// | |_| \__ \  __/ |  | | | | (_| | | | | | |  __/
//  \___/|___/\___|_|  |_| |_|\__,_|_| |_| |_|\___|
//
//  ____                            _
// |  _ \ _ __ ___  _ __ ___  _ __ | |_
// | |_) | '__/ _ \| '_ ` _ \| '_ \| __|
// |  __/| | | (_) | | | | | | |_) | |_
// |_|   |_|  \___/|_| |_| |_| .__/ \__|
//                           |_|
class UsernamePrompt extends Prompt {
    //
    message = [
        "Enter your username", //
        "((type *:help* for more info))", //
    ];

    //
    // When player types :help
    help = [
        "Your username.",
        "It's used, along with your password, when you log in.",
        "Other players can see it.",
        "Other players can use it to chat or trade with you",
        "It may only consist of the letters _a-z_, _A-Z_, _0-9_, and _underscore_",
    ];

    //
    // Let the client know that we're asking for a username
    options = { username: true };

    /** @type {PlayerCreationScene} */
    get scene() {
        return this._scene;
    }

    onReply(username) {
        //
        // do basic syntax checks on usernames
        if (!Security.isUsernameSane(username)) {
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

        this.scene.usernameAccepted(username);
    }
}

//  ____                                     _
// |  _ \ __ _ ___ _____      _____  _ __ __| |
// | |_) / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// |  __/ (_| \__ \__ \\ V  V / (_) | | | (_| |
// |_|   \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
//
//  ____                            _
// |  _ \ _ __ ___  _ __ ___  _ __ | |_
// | |_) | '__/ _ \| '_ ` _ \| '_ \| __|
// |  __/| | | (_) | | | | | | |_) | |_
// |_|   |_|  \___/|_| |_| |_| .__/ \__|
//                           |_|
class PasswordPrompt extends Prompt {
    //
    message = "Enter a password";

    //
    // Let the client know that we're asking for a password
    // so it can set <input type="password">
    options = { password: true };

    /** @type {string?} Password that was previously entered. */
    firstPassword = undefined;

    errorCount = 0;

    /** @type {PlayerCreationScene} */
    get scene() {
        return this._scene;
    }

    beforeExecute() {
        if (this.errorCount > MAX_PASSWORD_ATTEMPTS) {
            this.firstPassword = false;
            this.errorCount = 0;
            this.message = ["Too many errors - starting over", "Enter password"];
            return;
        }

        if (this.firstPassword && this.errorCount === 0) {
            this.message = "Repeat the password";
            return;
        }

        if (this.firstPassword && this.errorCount > 0) {
            this.message = [
                "Repeat the password",
                `((attempt nr. ${this.errorCount + 1} of ${MAX_PASSWORD_ATTEMPTS + 1}))`,
            ];
            return;
        }

        this.errorCount = 0;
        this.message = "Enter a password";
    }

    onReply(str) {
        if (!Security.isPasswordSane(str)) {
            this.sendError("Invalid password format.");
            this.errorCount++;
            this.execute();
            return;
        }

        if (!this.firstPassword) {
            this.firstPassword = str;
            this.execute();
            return;
        }

        if (this.firstPassword !== str) {
            this.errorCount++;
            this.execute();
            return;
        }

        this.scene.passwordAccepted(str);
    }
}
