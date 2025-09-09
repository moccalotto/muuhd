import { Game } from "../models/game.js";
import { ItemSeeder } from "./itemSeeder.js";
import { PlayerSeeder } from "./playerSeeder.js";

/**
 * Create and populate a Game object.
 *
 * This seeder creates all models necessary to play the game.
 *
 * If dev mode, we create  some known debug logins. (username = user, password = pass) as well as a few others
 */
export class GameSeeder {

    /** @returns {Game} */
    createGame() {

        /** @type {Game} */
        this.game = new Game();

        this.work(); // Seeding may take a bit, so let's defer it so we can return early.

        return this.game;
    }

    work() {
        console.info("seeding...");

        //
        (new PlayerSeeder(this.game)).seed(); // Create debug players
        (new ItemSeeder(this.game)).seed(); // Create items, etc.

        //
        // Done
        console.info("seeding done");
    }
}
