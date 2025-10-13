/** @typedef {import("../models/session.js").Session} Session */
/** @typedef {import("../util/messages.js").WebsocketMessage} WebsocketMessage */

/** @interface */
export class StateInterface {
    /** @param {Session} session */
    constructor(_session) {}

    onAttach() {}

    /** @param {WebsocketMessage} message */
    onMessage(_message) {}
}
