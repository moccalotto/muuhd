//
//   ____             __ _     __     __    _
//  / ___|___  _ __  / _(_) __ \ \   / /_ _| |_   _  ___  ___
// | |   / _ \| '_ \| |_| |/ _` \ \ / / _` | | | | |/ _ \/ __|
// | |__| (_) | | | |  _| | (_| |\ V / (_| | | |_| |  __/\__ \
//  \____\___/|_| |_|_| |_|\__, | \_/ \__,_|_|\__,_|\___||___/
//                         |___/
// ------------------------------------------------------------
//
// Change these values as necessary

//
// What is the name/type of environment we're running in?
const _env = process.env.MUUHD_ENV || "prod";

//
// Are we running in dev/development mode? Dev *cannot* be true if env==="prod"
const _dev = process.env.MUUHD_DEV || _env === "dev";

//
// What port should the server run on
const _port = process.env.MUUHD_PORT || 3000;

//
// How many players are allowed on this server.
const _maxPlayers = process.env.MUUHD_MAX_PLAYERS || (_dev ? 3 : 40);

//
// How many characters can be in a player's party;
const _maxPartySize = 4;

//
// When kicked out for too many failed password attempts, how long should the account be locked?
const _accountLockoutSeconds = 15 * 60 * 1000; // 15 minutes

//
// What is the random number seed of the server?
const _rngSeed = process.env.MUUHD_RNG_SEED || Date.now();

//
// Max size (in bytes) we allow incoming messages to be.
const _maxIncomingMessageSize = 1024;

//
//
//
//
//  _   _      _                 ____  _                   _
// | | | | ___| |_ __   ___ _ __/ ___|| |_ _ __ _   _  ___| |_
// | |_| |/ _ \ | '_ \ / _ \ '__\___ \| __| '__| | | |/ __| __|
// |  _  |  __/ | |_) |  __/ |   ___) | |_| |  | |_| | (__| |_
// |_| |_|\___|_| .__/ \___|_|  |____/ \__|_|   \__,_|\___|\__|
//              |_|
// -------------------------------------------------------------
// No need to change the code below this line.

/** Config class */
export const Config = {
    /** @readonly @type {string} the name of the environment we're running in */
    get env() {
        return _env || "prod";
    },

    /** @readonly @type {boolean} are we running in development-mode? */
    get dev() {
        if (_dev === true) {
            // no matter what, we do not allow dev mode in prod!
            return this.env !== "prod";
        }

        return false;
    },

    /** @readonly @constant {number} Port we're running the server on. */
    get port() {
        return _port | 0 || 3000;
    },

    /** @readonly @constant {number} Maximum number of players allowed on the server. */
    get maxPlayers() {
        return _maxPlayers | 0 || 3;
    },

    /** @readonly @constant @type {number} Max number of characters in a party. */
    get maxPartySize() {
        return _maxPartySize | 0 || 4;
    },

    /** @readonly @constant @constant {number} Number of failed logins allowed before user is locked out. Also known as Account lockout threshold */
    get() {
        return _maxFailedLogins | 0 || 4;
    },

    /**
     * When a user has entered a wrong password too many times,
     * block them for this long (in seconds) before they can try again.
     *
     * @readonly
     * @constant {number}
     */
    get accountLockoutSeconds() {
        return _accountLockoutSeconds | 0 || 15 * 60; // 15 minutes.
    },

    /** @type {number} Initial seed for the random number generator. */
    get rngSeed() {
        return _rngSeed | 0 || Date.now();
    },

    /** @type {number} Max size (in bytes) of max incoming message */
    get maxIncomingMessageSize() {
        return _maxIncomingMessageSize | 0 || 1024;
    },
};
