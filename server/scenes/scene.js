import { Session } from "../models/session.js";
import { Prompt } from "./prompt.js";
const MsgContext.ERROR_INSANE_PASSWORD = "Invalid password.";
const MsgContext.ERROR_INCORRECT_PASSWOD = "Incorrect password.";

/**
 * @abstract
 * @method onReady
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

    constructor() {
    }

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
    doPrompt(prompt) {
        this._prompt = prompt;
        prompt.execute();
    }
}
