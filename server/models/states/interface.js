import { ClientMessage } from "../../utils/messages.js";
import { Session } from "../session.js";

/** @interface */
export class StateInterface {
    /** @param {Session} session */
    constructor(session) { }

    onAttach() { }

    /** @param {ClientMessage} message */
    onMessage(message) {}
}
