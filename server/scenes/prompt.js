import figlet from "figlet";
import { gGame } from "../models/globals.js";
import * as msg from "../utils/messages.js";
import { Session } from "../models/session.js";
import { Scene } from "./scene.js";
import { WebsocketMessage } from "../utils/messages.js";
import { mustBe, mustBeString } from "../utils/mustbe.js";

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
    /** @protected @readonly @constant @type {Scene} */
    scene;

    //
    // Extra info about the prompt we send to the client.
    promptOptions = undefined;

    /**
     * Dictionary of help topics.
     * Keys: string matching /^[a-z]+$/ (topic name)
     * Values: string containing the help text
     *
     * @constant
     * @readonly
     * @type {Record<string, string>}
     */
    helpText = {
        "": "Sorry, no help available. Figure it out yourself, adventurer", // default help text
    };

    /** @type {string|string[]} Default prompt text to send if we don't want to send something in the execute() call. */
    promptText = [
        "Please enter some very important info", // Stupid placeholder text
        "((or type :quit to run away))", // strings in double parentheses is rendered shaded/faintly
    ];

    /** @type {object|string} If string: the prompt's context (username, password, etc) of object, it's all the message's options */
    promptOptions = {};

    /** @type {Session} */
    get session() {
        return this.scene.session;
    }

    /** @param {Scene} scene */
    constructor(scene) {
        if (!(scene instanceof Scene)) {
            throw new Error("Expected an instance of >>Scene<< but got " + typeof scene);
        }
        this.scene = scene;
    }

    /**
     * Triggered when the prompt has been attached to a scene, and is ready to go.
     *
     * It's here you want to send the prompt text via the sendPrompt() method
     */
    execute() {
        this.sendPrompt(this.promptText, this.promptOptions);
    }

    /** Triggered when user types `:help` without any topic */
    onHelp(topic) {
        let h = this.helpText;
        if (typeof h === "string" || Array.isArray(h)) {
            h = { "": h };
        }

        //
        // Fix data formatting shorthand
        // So lazy dev set help = "fooo" instead of help = { "": "fooo" }.
        if (h[topic]) {
            this.sendText(h[topic]);
            return;
        }

        this.onHelpFallback(topic);
    }

    /**
     * Triggered when a user types a :command that begins with a colon
     *
     * @param {string} command
     * @param {string} argLine
     */
    onColon(command, argLine) {
        const methodName = "onColon_" + command;
        const method = this[methodName];
        if (typeof method === "function") {
            method.call(this, argLine);
            return;
        }

        //
        // For static "denial of commands" such as :inv ==> "you cannot access your inventory right now"
        if (typeof method === "string") {
            this.sendText(method);
        }

        // :inv ==> you cannot INV right now
        this.sendError(`You cannot ${command.toUpperCase()} right now`);
    }

    /**
     * Triggered when the player asks for help on a topic, and we dont have an onHelp_thatParticularTopic method.
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
    onReply(message) {}

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
     * @param {string} systemMessageType
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
        this.session.calamity();
    }

    //
    // Easter ægg
    onColon_pull_out_wand = "You cannot pull out your wand right now! But thanks for trying 😘🍌🍆";

    //
    // Easter ægg2
    onColon_imperial(argLine) {
        const n = Number(argLine);

        this.sendText(`${n} centimeters is only ${n / 2.54} inches. This is why americans have such small wands`);
    }
}
