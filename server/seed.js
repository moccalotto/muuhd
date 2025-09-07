import { Game } from "./models/game.js";
import { Player } from "./models/player.js";

//  ____  _____ _____ ____  _____ ____
// / ___|| ____| ____|  _ \| ____|  _ \
// \___ \|  _| |  _| | | | |  _| | |_) |
//  ___) | |___| |___| |_| | |___|  _ <
// |____/|_____|_____|____/|_____|_| \_\
//
/** @param {Game} game */
export class Seeder {
    seed(game) {
        /** @protected @type {Game} */
        this.game = game;

        this.createPlayers();
    }

    /** @protected */
    createPlayers() {
        // "pass" encrypted by client is:
        //      "V1_Kims_Krappy_Krypto:1000:SHA-256:8bdff92251f55df078f7a12446748fbeeb308991008096bf2eed3fd8926d0301"
        // "pass" encrypted by client and then by server is:
        //      "1000:833d63b13a187a0d8950c83ad6d955b9:4bdc9981dd245e7c77949e0166094264f98c62ae9f4f5ebbcda50728bbb8b080"
        //
        // Since the server-side hashes have random salts, the hashes themselves can change for the same password.
        // The client side hash must not have a random salt, otherwise, it must change every time.
        //
        // The hash below is just one has that represents the password "pass" sent via V1 of the "Kims Krappy Krypto" scheme.
        //
        const passwordHash = "1000:bdaa0d7436caeaa4d278e7591870b68c:151b8f7e73a97a01af190a51b45ee389c2f4590a6449ddae6f25b9eab49cac0d";
        const player = new Player("user", passwordHash);
        this.game.players.set("user", player);

        // const char = new Character(player.username, "Sir Debug The Strong", true);
    }
}
