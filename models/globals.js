import { Config } from "../config.js";
import { Game } from "./game.js";

/** @constant @readonly @type {Game} Global instance of Game */
export const gGame = new Game(Config.rngSeed);
