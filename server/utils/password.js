import { randomBytes, pbkdf2Sync, randomInt } from "node:crypto";

// Settings (tune as needed)
const ITERATIONS = 100_000; // Slow enough to deter brute force
const KEYLEN = 64; // 512-bit hash
const DIGEST = "sha512";

/**
 * Generate a hash from a plaintext password.
 * @param {String} password
 * @returns String
 */
export function hash(password) {
    const salt = randomBytes(16).toString("hex"); // 128-bit salt
    const hash = pbkdf2Sync(
        password,
        salt,
        ITERATIONS,
        KEYLEN,
        DIGEST,
    ).toString("hex");
    return `${ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verify that a password is correct against a given hash.
 *
 * @param {String} password
 * @param {String} hashed_password
 * @returns Boolean
 */
export function verify(password, hashed_password) {
    const [iterations, salt, hash] = hashed_password.split(":");
    const derived = pbkdf2Sync(
        password,
        salt,
        Number(iterations),
        KEYLEN,
        DIGEST,
    ).toString("hex");
    return hash === derived;
}
