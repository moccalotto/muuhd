const dev = process.env.NODE_ENV === "dev";
const env = process.env.PROD || (dev ? "dev" : "prod");

export const Config = {
    /** @readonly @type {string} the name of the environment we're running in */
    "env": env,

    /** @readonly @type {boolean} are we running in development-mode? */
    "dev": dev,

    /**
     * Port we're running the server on.
     *
     * @readonly
     * @const {number} 
     */
    port: process.env.PORT || 3000,

    /**
     * Maximum number of players allowed on the server.
     *
     * @readonly
     * @const {number}
     */
    maxPlayers: dev ? 3 : 40,

    /**
     * Max number of characters in a party.
     * By default, a player can only have a single party.
     * Multiple parties may happen some day.
     */
    maxPartySize: 4,

    /**
     * Number of failed logins allowed before user is locked out.
     * Also known as Account lockout threshold
     *
     * @readonly
     * @const {number}
     */
    maxFailedLogins: 5,

    /**
     * When a user has entered a wrong password too many times,
     * block them for this long before they can try again.
     *
     * @readonly
     * @const {number}
     */
    accountLockoutDurationMs: 15 * 60 * 1000, // 15 minutes.
};


