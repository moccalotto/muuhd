import * as roll from "../utils/dice.js";
import * as id from "../utils/id.js";

/**
 * A playable character.
 *
 * @class
 */
export class Character {

    /** @type {string} character's name */
    name;

    /** @protected @type {number} The number of XP the character has. */
    _xp = 0;
    get xp() { return this._xp; }

    /** @protected @type {number} The character's level. */
    _level = 1;
    get level() { return this._level; }

    /** @protected @type {string} unique name used for chats when there's a name clash and also other things that require a unique character id */
    _id;
    get id() { return this._id; }

    /** @protected @type {string} username of the player that owns this character. */
    _username;
    get username() { return this._username; }

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
    proficiencies = new Set();

    /** @type {Map<string,number} Things the character is particularly proficient at. */
    equipment = new Map();

    /**
     * @param {string} username The name of player who owns this character. Note that the game can own a character - somehow.
     * @param {string} name The name of the character
     * @param {boolean} initialize Should we initialize the character
     */
    constructor(playerUname, name, initialize) {

        this.name = name;

        // Initialize the unique name if this character.
        //
        // things to to hell if two characters with the same name are created at exactly the same time with the same random seed.
        this._id = id.fromName(playerUname, name);

        // should we skip initialization of this object
        if (initialize !== true) {
            return;
        }

        //
        // Initializing
        //

        // Rolling skills

        /** @type {number} Awareness Skill */
        this.awareness = roll.d6() + 2;

        /** @type {number} Grit Skill */
        this.grit = roll.d6() + 2;

        /** @type {number} Knowledge Skill */
        this.knowledge = roll.d6() + 2;

        /** @type {number} Magic Skill */
        this.magic = roll.d6() + 2;

        /** @type {number} Melee Attack Skill */
        this.meleeCombat = roll.d6() + 2;

        /** @type {number} Ranged Attack Skill */
        this.rangedCombat = roll.d6() + 2;

        /** @type {number} Skulduggery Skill  */
        this.skulduggery = roll.d6() + 2;

        switch (roll.d8()) {
            case 1:
                this.ancestry = "human";
                // Humans get +1 to all skills
                this.awareness++;
                this.grit++;
                this.knowledge++;
                this.magic++;
                this.meleeCombat++;
                this.rangedCombat++;
                this.skulduggery++;
                break;
            case 2:
                this.ancestry = "dwarven";
                this.meleeCombat = Math.max(this.meleeCombat, 10);
                break;
            case 3:
                this.ancestry = "elven";
                this.rangedCombat = Math.max(this.rangedCombat, 10);
                break;
            case 4:
                this.ancestry = "giant";
                this.meleeCombat = Math.max(this.grit, 10);
                break;
            case 5:
                this.ancestry = "Gnomish";
                this.meleeCombat = Math.max(this.awareness, 10);
                break;
            case 6:
                this.ancestry = "primordial";
                this.meleeCombat = Math.max(this.magic, 10);
                break;
            case 7:
                this.ancestry = "draconic";
                this.meleeCombat = Math.max(this.knowledge, 10);
                break;
            case 8:
                this.ancestry = "demonic";
                this.meleeCombat = Math.max(this.skulduggery, 10);
                break;
            default:
                throw new Error('Logic error, ancestry d8() roll was out of scope');
        }

        //
        // Determine the character's Foundation
        //
        //
        /** @type {string} Foundational background */
        this.foundation = "";
        const foundationRoll = roll.withSides(15);
        switch (foundationRoll) {
            case 1:
                this.foundation = "brawler";
                this.proficiencies.add("light_armor");
                this.equipment.set("studded_leather", 1);
                this.equipment.set("spiked_gauntlets", 1);

                this.silver = 40;
                this.maxHitPoints = this.currentHitPoints = 15;
                this.itemSlots = 7;
                this.meleeCombat = Math.max(this.meleeCombat, 10);
                this.knowledge = Math.min(this.knowledge, 10);
                break;
            case 2:
                this.foundation = "druid";
                this.proficiencies.add("armor/natural");
                this.equipment
                    .set("sickle", 1)
                    .set("poisoner's kit", 1)
                    .set("healer's kit", 1)
            default:
                this.foundation = "debug";
                this.proficiencies.add("heavy_armor");
                this.proficiencies.add("heavy_weapons");
                this.equipment.set("debug_armor", 1);
                this.equipment.set("longsword", 1);
                this.silver = 666;

                this.itemSlots = 10;
                this.maxHitPoints = 20;
                this.currentHitPoints = 20;

            // default:
            //     throw new Error(`Logic error, foundation d15 roll of ${foundationRoll} roll was out of scope`);
        }
    }
}

const c = new Character("username", "test", true);

console.log(c);
