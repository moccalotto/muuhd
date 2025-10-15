import { PasswordPrompt } from "./passwordPrompt.js";
import { Scene } from "../scene.js";
import { UsernamePrompt } from "./usernamePrompt.js";
import { PlayerCreationScene } from "../playerCreation/playerCreationSene.js";
import { GameScene } from "../gameLoop/gameScene.js";

/** @typedef {import("../../models/player.js").Player} Player */

/** @property {Session} session */
export class AuthenticationScene extends Scene {
    introText = [
        "= Welcome!", //
    ];

    /** @type {Player} */
    player;

    onReady() {
        // current prompt
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
