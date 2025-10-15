import { sprintf } from "sprintf-js";

/** @typedef {import("../utils/messages.js").WebsocketMessage} WebsocketMessage */
/** @typedef {import("../models/session.js").Session} Session */
/** @typedef {import("./prompt.js").Prompt } Prompt */

/**
 * Scene - a class for showing one or more prompts in a row.
 *
 * Scenes are mostly there to keep track of which prompt to show,
 * and to store data for subsequent prompts to access.
 *
 * The prompts themselves are responsible for data validation and
 * interpretation.
 *
 * @abstract
 */
export class Scene {
    /**
     * @type {string|string[]} This text is shown when the scene begins
     */
    introText = "";

    /** @readonly @constant @protected @type {Session} */
    _session;
    get session() {
        return this._session;
    }

    /**
     * The Prompt that is currently active.
     * I.e. the handler for the latest question we asked.
     *
     * @readonly
     * @type {Prompt}
     */
    _currentPrompt;
    get currentPrompt() {
        return this._currentPrompt;
    }

    constructor() {}

    /** @param {Session} session */
    execute(session) {
        this._session = session;
        if (this.introText) {
            this.session.sendText(this.introText);
        }
        this.onReady();
    }

    /** @abstract */
    onReady() {
        throw new Error("Abstract method must be implemented by subclass");
    }

    /**
     * @param {Prompt} prompt
     */
    showPrompt(prompt) {
        this._currentPrompt = prompt;
        prompt.execute();
    }

    /** @param {new (scene: Scene) => Prompt} promptClassReference */
    show(promptClassReference) {
        this.showPrompt(new promptClassReference(this));
    }

    /**
     * The user has been prompted, and has replied.
     *
     * We route that message to the current prompt.
     *
     * It should not be necessary to override this function
     *
     * @param {WebsocketMessage} message
     */
    onReply(message) {
        console.log("REPLY", {
            message,
            type: typeof message,
        });
        this.currentPrompt.onReply(message.text);
    }

    /**
     * The user has declared their intention to quit.
     *
     * We route that message to the current prompt.
     *
     * It should may be necessary to override this method
     * in case you want to trigger specific behavior before
     * quitting.
     *
     * Default behavior is to route this message to the current prompt.
     */
    onQuit() {
        this.currentPrompt.onQuit();
    }

    /**
     * The user has typed :help [topic]
     *
     * We route that message to the current prompt.
     *
     * It should not be necessary to override this function
     * unless you want some special prompt-agnostic event
     * to be triggered - however, scenes should not have too
     * many prompts, so handling this behavior inside the prompt
     * should be the primary choice.
     *
     * @param {WebsocketMessage} message
     */
    onHelp(message) {
        this.currentPrompt.onHelp(message.text);
    }

    /**
     * Triggered when a user types a :command that begins with a colon
     * and the current Prompt cannot handle that command.
     *
     * @param {string} command
     * @param {any[]} args
     */
    onColonFallback(command, args) {
        const propertyName = "onColon__" + command;
        const property = this[propertyName];

        //
        // Default: we have no handler for the Foo command
        if (property === undefined) {
            this.session.sendError(`You cannot ${command.toUpperCase()} right now`); // :foo ==> you cannot FOO right now
            return;
        }

        //
        // If this scene has a method called onColon_foo() =>
        if (typeof property === "function") {
            property.call(this, args);
            return;
        }

        //
        // If this scene has a string property called onColon_foo =>
        if (typeof property === "string") {
            this.session.sendText(property);
            return;
        }

        //
        // We found a property that has the right name but the wrong type.
        throw new Error(
            [
                `Logic error. Scene has a handler for a command called ${command}`,
                `but it is neither a function or a string, but a ${typeof property}`,
            ].join(" "),
        );
    }

    /**
     * The user has typed :help [topic]
     *
     * We route that message to the current prompt.
     *
     * There is no need to override this method.
     *
     * onColonFallback will be called if the current prompt
     * cannot handle the :colon command.
     *
     * @param {WebsocketMessage} message
     */
    onColon(message) {
        const handledByPrompt = this.currentPrompt.onColon(message.command, message.args);

        if (!handledByPrompt) {
            this.onColonFallback(message.command, message.args);
        }
    }

    //
    // Example dynamic colon handler (also easter egg)
    /** @param {any[]} args */
    onColon__imperial(args) {
        if (args.length === 0) {
            this.session.sendText("The imperial system is the freeest system ever. Also the least good");
        }

        const n = Number(args[0]);

        this.session.sendText(
            sprintf("%.2f centimeters is only %.2f inches. This is american wands are so short!", n, n / 2.54),
        );
    }

    onColon__hi = "Ho!";
}
