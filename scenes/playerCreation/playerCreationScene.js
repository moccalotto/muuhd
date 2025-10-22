import { Config } from "../../config.js";
import { gGame } from "../../models/globals.js";
import { Security } from "../../utils/security.js";
import { Scene } from "../scene.js";
import { CreateUsernamePrompt } from "./createUsernamePrompt.js";

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

        this.showPrompt(new CreateUsernamePrompt(this));
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
        this.session.sendText(`Username _*${username}*_ is available, and I've reserved it for you :)`);

        //
        this.session.sendError("TODO: create a createPasswordPrompt and display it.");
    }

    /**
     *
     * Called when the player has entered a password and confirmed it.
     *
     * @param {string} password
     */
    passwordAccepted(password) {
        this.password = password;
        this.session.sendText("*_Success_* ✅ You will now be asked to log in again, sorry for that ;)");
        this.player.setPasswordHash(Security.generateHash(this.password));
    }
}
