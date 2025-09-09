import * as msg from "../utils/messages.js";
import * as security from "../utils/security.js";
import { CreatePlayerState } from "./createPlayer.js";
import { JustLoggedInState } from "./justLoggedIn.js";
import { Session } from "../models/session.js";
import { Config } from "../config.js";

const STATE_EXPECT_USERNAME = "promptUsername";
const STATE_EXPECT_PASSWORD = "promptPassword";
const USERNAME_PROMPT = [
    "Please enter your _username_:",
    "((type *:create* if you want to create a new user))",
];
const PASSWORD_PROMPT = "Please enter your password";
const ERROR_INSANE_PASSWORD = "Invalid password.";
const ERROR_INSANE_USERNAME = "Username invalid, must be at 4-20 characters, and may only contain [a-z], [A-Z], [0-9] and underscore"
const ERROR_INCORRECT_PASSWOD = "Incorrect password.";

/** @property {Session} session */
export class AuthState {

    subState = STATE_EXPECT_USERNAME;

    /**
    * @param {Session} session
    */
    constructor(session) {
        /** @type {Session} */
        this.session = session;
    }

    onAttach() {
        this.session.sendFigletMessage("M U U H D");

        this.session.sendPrompt("username", USERNAME_PROMPT);
    }

    /** @param {msg.ClientMessage} message */
    onMessage(message) {
        if (this.subState === STATE_EXPECT_USERNAME) {
            this.receiveUsername(message);
            return;
        }

        if (this.subState === STATE_EXPECT_PASSWORD) {
            this.receivePassword(message);
            return;
        }

        console.error("Logic error, we received a message after we should have been logged in");
        this.session.sendError("I received a message didn't know what to do with!");
    }

    /** @param {msg.ClientMessage} message */
    receiveUsername(message) {

        //
        // handle invalid message types
        if (!message.isUsernameResponse()) {
            console.debug("what?!", message);
            this.session.sendError("Incorrect message type!");
            this.session.sendPrompt("username", USERNAME_PROMPT);
            return;
        }

        //
        // Handle the creation of new players
        if (message.username === ":create") {
            // TODO:
            // Set gamestate = CreateNewPlayer
            //
            // Also check if player creation is allowed in config/env
            this.session.setState(new CreatePlayerState(this.session));
            return;
        }

        //
        // do basic syntax checks on usernames
        if (!security.isUsernameSane(message.username)) {
            this.session.sendError(ERROR_INSANE_USERNAME);
            this.session.sendPrompt("username", USERNAME_PROMPT);
            return;
        }

        this.player = this.session.game.getPlayer(message.username);

        //
        // handle invalid username
        if (!this.player) {

            //
            // This is a security risk. In the perfect world we would allow the player to enter both
            // username and password before kicking them out, but since the player's username is not
            // an email address, and we discourage from using “important” usernames, then we tell the
            // player that they entered an invalid username right away.
            //
            // NOTE FOR ACCOUNT CREATION
            // Do adult-word checks, so we dont have Fucky_McFuckFace
            // https://www.npmjs.com/package/glin-profanity
            this.session.sendError("Incorrect username, try again");
            this.session.sendPrompt("username", USERNAME_PROMPT);
            return;
        }


        //
        // username was correct, proceed to next step
        this.subState = STATE_EXPECT_PASSWORD;
        this.session.sendSystemMessage("salt", this.player.salt);
        this.session.sendPrompt("password", PASSWORD_PROMPT);
    }

    /** @param {msg.ClientMessage} message */
    receivePassword(message) {

        //
        // handle invalid message types
        if (!message.isPasswordResponse()) {
            this.session.sendError("Incorrect message type!");
            this.session.sendPrompt("password", PASSWORD_PROMPT);
            return;
        }

        //
        // Check of the password is sane. This is both bad from a security point 
        // of view, and technically not necessary as insane passwords couldn't 
        // reside in the player lists. However, let's save some CPU cycles on 
        // not hashing an insane password 1000+ times.
        // This is technically bad practice, but since this is just a game,
        // do it anyway.
        if (!security.isPasswordSane(message.password)) {
            this.session.sendError(ERROR_INSANE_PASSWORD);
            this.session.sendPrompt("password", PASSWORD_PROMPT);
            return;
        }


        //
        // Block users who enter bad passwords too many times.
        if (this.player.failedPasswordsSinceLastLogin > Config.maxFailedLogins) {
            this.blockedUntil = new Date() + Config.maxFailedLogins,
            this.session.sendCalamity("You have been locked out for too many failed password attempts, come back later");
            this.session.close();
            return;
        }

        //
        // Handle blocked users.
        // They don't even get to have their password verified.
        if (this.player.blockedUntil > (new Date())) {
            this.session.sendCalamity("You have been locked out for too many failed password attempts, come back later");
            this.session.close();
            return;
        }

        //
        // Verify the password against the hash we've stored.
        if (!security.verifyPassword(message.password, this.player.passwordHash)) {
            this.session.sendError("Incorrect password!");
            this.session.sendPrompt("password", PASSWORD_PROMPT);
            this.player.failedPasswordsSinceLastLogin++;

            this.session.sendDebug(`Failed login attempt #${this.player.failedPasswordsSinceLastLogin}`);

            return;
        }



        this.player.lastSucessfulLoginAt = new Date();
        this.player.failedPasswordsSinceLastLogin = 0;

        this.session.player = this.player;
        //
        // Password correct, check if player is an admin
        if (this.player.isAdmin) {
            // set state AdminJustLoggedIn
        }

        //
        // Password was correct, go to main game
        this.session.setState(new JustLoggedInState(this.session));
    }
}
