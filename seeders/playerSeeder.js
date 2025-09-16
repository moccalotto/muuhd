import { gGame } from "../models/globals.js";
import { Player } from "../models/player.js";

export class PlayerSeeder {
    seed() {
        // Examples of the word "pass" hashed by the client and then the server:
        // Note that the word "pass" has gajillions of hashed representations, all depending on the salts used to hash them.
        // "pass" hashed by client:  KimsKrappyKryptoV1:userSalt:1000:SHA-256:b106e097f92ff7c288ac5048efb15f1a39a15e5d64261bbbe3f7eacee24b0ef4
        // "pass" hashed by server:  1000:15d79316f95ff6c89276308e4b9eb64d:2178d5ded9174c667fe0624690180012f13264a52900fe7067a13f235f4528ef
        //
        // Since the server-side hashes have random salts, the hashes themselves can change for the same password.
        // The client side hash must not have a random salt, otherwise, it must change every time.
        //
        // The hash below is just one has that represents the password "pass" sent via V1 of the "Kims Krappy Krypto" scheme.

        gGame.createPlayer(
            "user",
            "1000:15d79316f95ff6c89276308e4b9eb64d:2178d5ded9174c667fe0624690180012f13264a52900fe7067a13f235f4528ef",
            "userSalt",
        );

        gGame.createPlayer(
            "admin",
            "1000:a84760824d28a9b420ee5f175a04d1e3:a6694e5c9fd41d8ee59f0a6e34c822ee2ce337c187e2d5bb5ba8612d6145aa8e",
            "adminSalt",
        );
    }
}
