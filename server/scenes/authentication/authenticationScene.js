import { PasswordPrompt } from "./passwordPrompt.js";
import { Player } from "../../models/player.js";
import { Scene } from "../scene.js";
import { UsernamePrompt } from "./usernamePrompt.js";

/** @property {Session} session */
export class AuthenticationScene extends Scene {

    introText = [
        "= Welcome", //
    ];

    /** @type {Player} */
    player;

    onReady() {
        // current prompt
        this.doPrompt(new UsernamePrompt(this));
    }

    /** @param {Player} player */
    usernameAccepted(player) {
        this.player = player;
        this.doPrompt(new PasswordPrompt(this));
    }

    passwordAccepted() {
        this.player.loggedIn = true;
        this.session.player = this.player;

        if (this.player.admin) {
            this.session.setScene("new AdminJustLoggedInScene");
        } else {
            this.session.setScene("new JustLoggedInScene");
        }
    }
}
