import { randomBytes, pbkdf2Sync } from "node:crypto";
import { Config } from "../config.js";

// Settings (tune as needed)
const ITERATIONS = 1000; // MAGIC CONSTANT - move to Config
const DIGEST = "sha256"; // MAGIC CONSTANT - move to Config
const KEYLEN = 32; //       MAGIC CONSTANT - move to Config

/**
 * Generate a hash from a string
 * @param {string} source @returns {string}
 */
export function generateHash(source) {
    const salt = randomBytes(16).toString("hex"); // 128-bit salt
    const hash = pbkdf2Sync(source, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
    return `${ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verify that a password is correct against a given hash.
 *
 * @param {string} password_candidate
 * @param {string} stored_password_hash
 * @returns {boolean}
 */
export function verifyPassword(password_candidate, stored_password_hash) {
    const [iterations, salt, hash] = stored_password_hash.split(":");
    const derived = pbkdf2Sync(password_candidate, salt, Number(iterations), KEYLEN, DIGEST).toString("hex");
    const success = hash === derived;
    if (Config.dev) {
        console.debug(
            "Verifying password:\n" +
                "     Input    : %s (the password as it was sent to us by the client)\n" +
                "     Given    : %s (the input password hashed by us (not necessary for validation))\n" +
                "     Stored   : %s (the password hash we have on file for the player)\n" +
                "     Derived  : %s (the hashed version of the input password)\n" +
                "     Verified : %s (was the password valid)",
            password_candidate,
            generateHash(password_candidate),
            stored_password_hash,
            derived,
            success,
        );
    }
    return success;
}

/** @param {string} candidate */
export function isUsernameSane(candidate) {
    return Config.usernameSanityRegex.test(candidate);
}

/** @param {string} candidate */
export function isPasswordSane(candidate) {
    // We know the password must adhere to one of our client-side-hashed crypto schemes,
    // so we can be fairly strict with the allowed passwords
    return Config.passwordHashSanityRegex.test(candidate);
}
