import { Security } from "../../utils/security.js";
import { Config } from "../../config.js";
import { GameScene } from "../gameLoop/gameScene.js";
import { PlayerCreationScene } from "../playerCreation/playerCreationScene.js";
import { Prompt } from "../prompt.js";
import { Scene } from "../scene.js";
import { gGame } from "../../models/globals.js";

/** @typedef {import("../../models/player.js").Player} Player */

export class AuthenticationScene extends Scene {
    /** @type {Player} */
    player;

    onReady() {
        this.session.sendText("= Welcome");
        this.show(UsernamePrompt);
    }

    /** @param {Player} player */
    usernameSuccess(player) {
        this.player = player;
        this.session.sendSystemMessage("salt", player.salt);
        this.show(PasswordPrompt);
    }

    passwordSuccess() {
        this.player.loggedIn = true;

        this.session.setPlayer(this.player);
        this.session.setScene(new GameScene(this.session));
    }

    /**
     * User typed `:create`
     *
     * Create new player
     */
    onColon__create() {
        this.session.setScene(new PlayerCreationScene(this.session));
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
/** @property {AuthenticationScene} scene */
class UsernamePrompt extends Prompt {
    //
    message = [
        "Please enter your username:", //
        "((type _*:help*_ to see your other options))",
    ];

    //
    // When player types :help
    help = [
        "Enter your username to proceed with loggin in",
        "Type _*:create*_ if you are not already registered, and want to create a new account",
        "Only a username and password is required - not your email",
    ];
    options = { username: true };

    /** @returns {AuthenticationScene} workaround for proper type hinting */
    get scene() {
        return this._scene;
    }

    //
    // User replied to our prompt
    onReply(username) {
        //
        // do basic syntax checks on usernames
        if (!Security.isUsernameSane(username)) {
            console.info("Someone entered insane username: '%s'", username);
            this.sendError("Incorrect username, try again");
            this.execute();
            return;
        }

        //
        // try and fetch the player object from the game
        const player = gGame.getPlayerByUsername(username);

        //
        // handle invalid username
        if (!player) {
            console.info("Someone entered incorrect username: '%s'", username);
            this.sendError("Incorrect username, try again");
            this.execute();
            return;
        }

        //
        // Tell daddy that we're done
        this.scene.usernameSuccess(player);
    }
}

//
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
    message = "Please enter your password";
    options = { password: true };

    get player() {
        return this.scene.player;
    }

    /** @returns {AuthenticationScene} */
    get scene() {
        return this._scene;
    }

    onReply(text) {
        //
        // Check of the password is sane. This is both bad from a security point
        // of view, and technically not necessary as insane passwords couldn't
        // reside in the player lists. However, let's save some CPU cycles on
        // not hashing an insane password 1000+ times.
        // This is technically bad practice, but since this is just a game,
        // do it anyway.
        if (!Security.isPasswordSane(text)) {
            this.sendError("Insane password");
            this.execute();
            return;
        }

        //
        // Block users who enter bad passwords too many times.
        if (this.player.failedPasswordsSinceLastLogin > Config.maxFailedLogins) {
            this.blockedUntil = Date.now() + Config.accountLockoutSeconds * 1000;
            this.calamity("You have been locked out for too many failed password attempts, come back later");
            return;
        }

        //
        // Handle blocked users.
        // They don't even get to have their password verified.
        if (this.player.blockedUntil > Date.now()) {
            //
            // Try to re-login too soon, and your lockout lasts longer.
            this.blockedUntil += Config.accountLockoutSeconds * 1000;
            this.calamity("You have been locked out for too many failed password attempts, come back later");
            return;
        }

        //
        // Verify the password against the hash we've stored.
        if (!Security.verifyPassword(text, this.player.passwordHash)) {
            this.sendError("Incorrect password!");
            this.player.failedPasswordsSinceLastLogin++;

            this.session.sendDebug(`Failed login attempt #${this.player.failedPasswordsSinceLastLogin}`);
            this.execute();

            return;
        }

        this.player.lastSucessfulLoginAt = new Date();
        this.player.failedPasswordsSinceLastLogin = 0;

        //
        // We do not allow a player to be logged in more than once!
        if (this.player.loggedIn) {
            this.calamity("This player is already logged in");
            return;
        }

        // Password was correct, go to main game
        this.scene.passwordSuccess();
    }
}
