import { Security } from "../../utils/security.js";
import { Config } from "../../config.js";
import { GameScene } from "../gameLoop/gameScene.js";
import { PlayerCreationScene } from "../playerCreation/playerCreationSene.js";
import { Prompt } from "../prompt.js";
import { Scene } from "../scene.js";
import { gGame } from "../../models/globals.js";

/** @typedef {import("../../models/player.js").Player} Player */

/** @property {Session} session */
export class AuthenticationScene extends Scene {
    introText = [
        "= Welcome!", //
    ];

    /** @type {Player} */
    player;

    onReady() {
        this.show(UsernamePrompt);
    }

    /** @param {Player} player */
    usernameAccepted(player) {
        this.player = player;
        this.session.sendSystemMessage("salt", player.salt);
        this.show(PasswordPrompt);
    }

    passwordAccepted() {
        this.player.loggedIn = true;

        this.session.setPlayer(this.player);
        this.session.sendText(["= Success!", "((but I don't know what to do now...))"]);
        this.session.setScene(new GameScene());
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

class UsernamePrompt extends Prompt {
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
        this.scene.usernameAccepted(player);
    }
}

class PasswordPrompt extends Prompt {
    //
    promptText = "Please enter your password";

    //
    // Let the client know that we're asking for a password
    // so it can set <input type="password">
    promptOptions = { password: true };

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
        // this.scene.passwordAccepted();
        this.scene.passwordAccepted();
    }
}
