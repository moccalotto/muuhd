import { Config } from "../config.js";
import { gGame } from "../models/globals.js";
import { CharacterSeeder } from "./characerSeeder.js";
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
    seed() {
        console.info("seeding");

        gGame.rngSeed = Config.rngSeed;
        new PlayerSeeder().seed(); // Create debug players
        new ItemSeeder().seed(); // Create items, etc.
        new CharacterSeeder().createParty(gGame.getPlayerByUsername("user"), 3); // Create debug characters.

        //
        // Done
        console.info("seeding done");
    }
}
