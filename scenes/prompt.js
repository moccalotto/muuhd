/** @typedef {import("../models/session.js").Session} Session */
/** @typedef {import("../utils/message.js").MessageType} MessageType */
/** @typedef {import("../utils/message.js").WebsocketMessage} WebsocketMessage */
/** @typedef {import("./scene.js").Scene} Scene */

/**
 * @typedef {object} PromptMethods
 * @property {function(...any): any} [onColon_*] - Any method starting with "onColon_"
 */

/**
 * @abstract
 * @implements {PromptMethods}
 * @class
 * @dynamic Methods are dynamically created:
 * - onColon(...)
 */
export class Prompt {
    /** @protected @type {Scene} */
    _scene;

    /** @type {Scene} */
    get scene() {
        return this._scene;
    }

    /**
     * Dictionary of help topics.
     * Keys: string matching /^[a-z]+$/ (topic name)
     * Values: string containing the help text
     *
     * If you want truly custom help texts, you must override the onHelpFallback function,
     * but overriding the onHelp() function gives you more control and skips this help
     * dictionary entirely.
     *
     * @constant
     * @readonly
     * @type {Record<string, string|string[]>}
     */
    help = {};

    /**
     * Default prompt text to send if we don't want to send something in the execute() call.
     *
     * Array values will be converted to multiline strings with newlines between each string
     * in the array.
     *
     * @type {string|string[]}
     */
    message = [
        "Please enter some very important info", // Silly placeholder text
        "((or type :quit to run away))", // strings in double parentheses is rendered shaded/faintly
    ];

    /** @type {object|string} If string: the prompt's context (username, password, etc). If object: it's all the message's options */
    /* @example
     *
     * // if the prompt expects a username
     * options = { username : true };
     *
     * // if the prompt expects a password
     * options = { password : true };
     */
    options = {};

    /** @type {Session} */
    get session() {
        return this.scene.session;
    }

    /** @param {Scene} scene */
    constructor(scene) {
        this._scene = scene;
    }

    /**
     * Triggered when the prompt has been attached to a scene, and is ready to go.
     *
     * It's here you want to send the prompt text via the sendPrompt() method
     */
    execute() {
        this.prepareProperties();

        this.sendPrompt(this.message, this.options);
    }

    /**
     * Normalize / massage the properties of the Prompt.
     *
     * This function cannot be called from the Prompt base constructor, as the
     * properties of the child class have not been set yet.
     */
    prepareProperties() {
        //
        // Lazy dev set property help = "fooo" instead of help = { "": "fooo" }.
        if (this.help && (typeof this.help === "string" || Array.isArray(this.help))) {
            this.help = { "": this.help };
        }
    }

    /** Triggered when user types `:help [some optional topic]` */
    onHelp(topic) {
        if (!this.help) {
            this.sendText("No help available at this moment - figure it out yourself, adventurer");
            return;
        }

        if (this.help[topic]) {
            this.sendText(this.help[topic]);
            return;
        }

        this.onHelpFallback(topic);
    }

    /**
     * Triggered when a user types a :command that begins with a colon
     *
     * @param {string} command
     * @param {any[]} args
     *
     * @returns {boolean} true if the command was handled in the prompt.
     */

    onColon(command, args) {
        const methodName = "onColon__" + command;
        const property = this[methodName];

        //
        // Default: we have no handler for the Foo command,
        // So let's see if daddy can handle it.
        if (property === undefined) {
            return false;
        }

        //
        // If the prompt has a method called onColon_foo() =>
        if (typeof property === "function") {
            property.call(this, args);
            return true;
        }

        //
        // If the prompt has a _string_ called onColon_foo =>
        if (typeof property === "string") {
            this.sendText(property);
            return true;
        }

        //
        // We found a property that has the right name but the wrong type.
        throw new Error(
            [
                `Logic error. Prompt has a handler for a command called ${command}`,
                `but it is neither a function or a string, but a ${typeof property}`,
            ].join(" "),
        );
    }

    /**
     * Triggered when the player asks for help on a topic, and we don't have an onHelp_thatParticularTopic method.
     *
     * @param {string} topic
     */
    onHelpFallback(topic) {
        this.sendError(`Sorry, no help available for topic “${topic}”`);
    }

    /**
     * Handle ":quit" messages
     *
     * The session will terminate no matter what. This just gives the State a chance to clean up before dying.
     *
     * @param {WebsocketMessage} message
     *
     */
    onQuit() {}

    /**
     * Triggered when the player replies to the prompt-message sent by this prompt-object.
     *
     * @param {WebsocketMessage} message  The incoming reply
     */
    onReply() {}

    /**
     * @overload
     * @param {string|string[]} text The prompt message (the request to get the user to enter some info).
     * @param {string} context
     */ /**
     * @overload
     * @param {string|string[]} text The prompt message (the request to get the user to enter some info).
     * @param {object} options Any options for the text (client side text formatting, color-, font-, or style info, etc.).
     */
    sendPrompt(...args) {
        this.session.sendPrompt(...args);
    }

    /**
     * Send text to be displayed to the client
     *
     * @param {string|string[]} text Text to send. If array, it will be joined/imploded with newline characters.
     * @param {object?} options message options for the client.
     */
    sendText(...args) {
        this.session.sendText(...args);
    }

    /** @param {string} errorMessage */
    sendError(...args) {
        this.session.sendError(...args);
    }

    /**
     * @param {string} systemMessageType  The subtype of the system message (dev, salt, username, etc.)
     * @param {any?} value
     */
    sendSystemMessage(...args) {
        this.session.sendSystemMessage(...args);
    }

    /**
     * Send a calamity text and then close the connection.
     * @param {string} errorMessage
     */
    calamity(...args) {
        this.session.calamity(...args);
    }

    //
    // Easter ægg(with an æ)
    // Example of having a string as a colon-handler
    onColon__pull_out_wand = "You cannot pull out your wand right now. Try again at a more appropriate time";
}
