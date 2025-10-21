import { sprintf } from "sprintf-js";
import { Prompt } from "./prompt.js";

/** @typedef {import("../utils/messages.js").WebsocketMessage} WebsocketMessage */
/** @typedef {import("../models/session.js").Session} Session */
/** @typedef {import("./prompt.js").Prompt } Prompt */
/** @typedef {new (scene: Scene) => Prompt} PromptClassReference */

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
    /** @constant @readonly @type {string|string[]|PromptClassReference} Text or prompt to show when this scene begins */
    intro;

    /** @readonly @constant @protected @type {Session} */
    #session;
    get session() {
        return this.#session;
    }

    /**
     * The Prompt that is currently active.
     * I.e. the handler for the latest question we asked.
     *
     * @readonly
     * @type {Prompt}
     */
    #currentPrompt;
    get currentPrompt() {
        return this.#currentPrompt;
    }

    constructor() {}

    /** @param {Session} session */
    execute(session) {
        this.#session = session;
        this.onReady();
    }

    onReady() {
        if (!this.intro) {
            return;
        }

        this.show(this.intro);
    }

    /** @param {Prompt} prompt */
    showPrompt(prompt) {
        this.#currentPrompt = prompt;
        prompt.execute();
    }

    /** @param {string|string[]} text */
    showText(text) {
        this.session.sendText(text);
    }

    /** @param {PromptClassReference|string|string[]|Prompt} value */
    show(value) {
        if (value instanceof Prompt) {
            this.showPrompt(value);
            return;
        }

        if (typeof value === "string" || typeof value[0] === "string") {
            this.showText(value);
            return;
        }

        if (typeof value !== "function") {
            throw new Error("Invalid type. Value must be string, string[], Prompt, or a class reference to Prompt");
        }

        const prompt = new value(this);
        if (!(prompt instanceof Prompt)) {
            throw new Error("Invalid class reference");
        }

        this.showPrompt(new value(this));
    }

    /**
     * The user has been prompted, and has replied.
     *
     * We route that message to the current prompt.
     *
     * You SHOULD NOT:
     *  - call this method directly
     *  - override this method
     *
     * @param {WebsocketMessage} message
     */
    onReply(message) {
        console.debug("REPLY", {
            message,
            type: typeof message,
        });

        if (!this.currentPrompt) {
            throw new Error("LogicError: cannot get a reply when you have not prompted the player");
        }

        this.currentPrompt.onReply(message.text);
    }

    /**
     * The user has declared their intention to quit.
     *
     * We route that message to the current prompt.
     *
     * It may be necessary to override this method in
     * case you want to trigger specific behavior before
     * quitting.
     *
     * You SHOULD NOT:
     *  - call this method directly
     */
    onQuit() {
        this.currentPrompt?.onQuit();
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
     * You SHOULD NOT:
     *  - call this method directly
     *
     * @param {WebsocketMessage} message
     */
    onHelp(message) {
        this.currentPrompt?.onHelp(message.text);
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
        const handledByPrompt = this.currentPrompt?.onColon(message.command, message.args);

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
            sprintf("%.2f centimeters is only %.2f inches. This is why american wands are so short!", n, n / 2.54),
        );
    }

    onColon__hi = "Ho!";
}
