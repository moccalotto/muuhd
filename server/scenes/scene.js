import { Session } from "../models/session.js";
import { Prompt } from "./prompt.js";

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

    /** @readonly @constant @type {Session} */
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
    _prompt;
    get prompt() {
        return this._prompt;
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
        this._prompt = prompt;
        prompt.execute();
    }

    /** @param {new (scene: Scene) => Prompt} promptClassReference */
    show(promptClassReference) {
        this.showPrompt(new promptClassReference(this));
    }

    /**
     * Triggered when a user types a :command that begins with a colon
     * and the current Prompt cannot handle that command.
     *
     * @param {string} command
     * @param {any[]} args
     */
    onColon(command, args) {
        const propertyName = "onColon__" + command;
        const property = this[propertyName];

        //
        // Default: we have no handler for the Foo command
        if (property === undefined) {
            this.session.sendError(`You cannot ${command.toUpperCase()} right now`, { verbatim: true }); // :foo ==> you cannot FOO right now
            return;
        }

        //
        // If the prompt has a method called onColon_foo() =>
        if (typeof property === "function") {
            property.call(this, args);
            return;
        }

        //
        // If the prompt has a _string_ called onColon_foo =>
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

    //
    // Easter ægg
    // Example dynamic colon handler
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

    onColon__hi = "Hoe";
}
