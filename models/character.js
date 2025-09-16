import * as roll from "../utils/dice.js";
import * as id from "../utils/id.js";
import { Item } from "./item.js";

/**
 * A playable character.
 *
 * @class
 */
export class Character {
    /** @type {string} character's name */
    name;

    /**
     * @protected
     * @type {number} The number of XP the character has.
     */
    xp = 0;

    /** @protected @type {number} The character's level. */
    level = 1;

    /** @type {number} Awareness Skill */
    awareness;

    /** @type {number} Grit Skill */
    grit;

    /** @type {number} Knowledge Skill */
    knowledge;

    /** @type {number} Magic Skill */
    magic;

    /** @type {number} Melee Attack Skill */
    meleeCombat;

    /** @type {number} Ranged Attack Skill */
    rangedCombat;

    /** @type {number} Skulduggery Skill  */
    skulduggery;

    /** @type {string} Bloodline background */
    ancestry;

    /** @type {string} Foundational background */
    foundation;

    /** @type {string} Money */
    silver;

    /** @type {number} Current number of hit points */
    currentHitPoints;

    /** @type {number} Number of hit points when fully healed */
    maxHitPoints;

    /** @type {number} Number items you can carry */
    itemSlots;

    /** @type {Set<string>} Things the character is particularly proficient at. */
    skills = new Set();

    /** @type {Map<Item,number} Things the character is particularly proficient at. */
    items = new Map();

    /**
     * @param {string} name The name of the character
     */
    constructor(name, initialize) {
        this.name = name;
    }

    /** Add an item to the equipment list
     * @param {Item} item
     * @param {number} count
     *
     * Maybe return the accumulated ItemSlots used?
     */
    addItem(item, count = 1) {
        if (!Number.isInteger(count)) {
            throw new Error("Number must be an integer");
        }
        if (!(item instanceof Item)) {
            console.debug("bad item", item);
            throw new Error("item must be an instance of Item!");
        }
        if (count <= 0) {
            throw new Error("Number must be > 0");
        }

        const existingItemCount = this.items.get(item) || 0;

        this.items.set(item, count + existingItemCount);
    }

    // todo removeItem(item, count)
}
