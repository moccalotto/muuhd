import { Session } from "../models/session.js";
import { PartyCreationState } from "./partyCreationState.js";
import { AwaitCommandsState } from "./awaitCommands.js";

/** @interface */
export class JustLoggedInState {
  /** @param {Session} session */
  constructor(session) {
    /** @type {Session} */
    this.session = session;
  }

  // Show welcome screen
  onAttach() {
    this.session.sendMessage([
      "",
      "Welcome",
      "",
      "You can type “:quit” at any time to quit the game",
      "",
    ]);

    //
    // Check if we need to create characters for the player
    if (this.session.player.characters.size === 0) {
      this.session.sendMessage(
        "You haven't got any characters, so let's make some\n\n",
      );
      this.session.setState(new PartyCreationState(this.session));
      return;
    }

    this.session.setState(new AwaitCommandsState(this.session));
  }
}
