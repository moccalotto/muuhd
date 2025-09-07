import { randomBytes, pbkdf2Sync } from "node:crypto";
import { DEV } from "./config.js";

// Settings (tune as needed)
const ITERATIONS = 1000;
const KEYLEN = 32; // 32-bit hash
const DIGEST = "sha256";

/**
 * Generate a hash from a plaintext password.
 * @param {string} password
 * @returns {string}
 */
export function generateHash(password) {
    const salt = randomBytes(16).toString("hex"); // 128-bit salt
    const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
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
    if (DEV) {
        console.debug(
            "Verifying password:\n" +
            "     Input    : %s\n" +
            "     Stored   : %s\n" +
            "     Given    : %s\n" +
            "     Derived  : %s\n" +
            "     Success  : %s",
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
    return /^[a-zA-Z0-9_]{4,}$/.test(candidate);
}

/** @param {string} candidate */
export function isPasswordSane(candidate) {
    // We know the password must adhere to one of our client-side-hashed crypto schemes, 
    // so we can be fairly strict with the allowed passwords
    return /^[a-zA-Z0-9_: -]{8,}$/.test(candidate);
}
