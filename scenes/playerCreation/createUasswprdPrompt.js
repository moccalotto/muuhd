import { Prompt } from "../prompt.js";
import { Security } from "../../utils/security.js";
import { Config } from "../../config.js";

export class CreatePasswordPrompt extends Prompt {
    //
    message = ["Enter a password"];

    //
    // Let the client know that we're asking for a password
    // so it can set <input type="password">
    options = { password: true };

    get player() {
        return this.scene.player;
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
            this.blockedUntil = Date.now() + Config.accountLockoutSeconds;
            this.calamity("You have been locked out for too many failed password attempts, come back later");
            return;
        }

        //
        // Handle blocked users.
        // They don't even get to have their password verified.
        if (this.player.blockedUntil > Date.now()) {
            //
            // Try to re-login too soon, and your lockout lasts longer.
            this.blockedUntil += Config.accountLockoutSeconds;
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

        this.scene.passwordAccepted();
    }
}
