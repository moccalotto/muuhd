/**
 * Abstract class for documentation purposes.
 * @abstract
 */
export class ItemAttributes {
    /** @constant @readonly @type {string} Machine-friendly name for the blueprint */
    blueprintId;

    /** @constant @readonly @type {string} Item's human-friendly name */
    name;

    /** @constant @readonly @type {string} Item's Description */
    description;

    /** @constant @readonly @type {number} Number of Item Slots taken up by this item. */
    itemSlots;

    /** @constant @readonly @type {number?} How much damage (if any) does this item deal */
    baseDamage;

    /** @constant @readonly @type {string?} Which special effect is triggered when successful attacking with this item? */
    specialEffect;

    /** @constant @readonly @type {boolean?} Can this item be used as a melee weapon? */
    melee;

    /** @constant @readonly @type {boolean?} Can this item be used as a ranged weapon? */
    ranged;

    /** @readonly @type {number} How many extra HP do you have when oyu wear this armor. */
    armorHitPoints;

    /** @constant @readonly @type {string?} Type of ammo that this item is, or that this item uses */
    ammoType;

    /** @readonly @type {number} how much is left in this item. (Potions can have many doses and quivers many arrows) */
    count;

    /** @readonly @type {number} Some items (quivers) can be replenished, so how much can this quiver/potion/ration pack hold */
    maxCount;

    /** @constant @readonly @type {string[]} Type of ammo that this item is, or that this item uses */
    skills = [];
}

/**
 * Item blueprints are the built-in basic items of the game.
 * A character cannot directly own one of these items,
 * they can only own Items, and ItemBlueprints can be used to
 * generate these Items.
 */
export class ItemBlueprint extends ItemAttributes {
    /**
     * Constructor
     *
     * @param {object} o Object whose attributes we copy
     */
    constructor(o) {
        super();

        if (typeof o.blueprintId !== "string" || o.name.length < 1) {
            throw new Error("blueprintId must be a string, but " + typeof o.blueprintId + " given.");
        }

        if (typeof o.name !== "string" || o.name.length < 1) {
            throw new Error("Name must be a string, but " + typeof o.name + " given.");
        }

        if (!Number.isFinite(o.itemSlots)) {
            throw new Error("itemSlots must be a finite number!");
        }

        o.itemSlots = Number(o.itemSlots);

        for (const [key] in this) {
            if (o[key] !== "undefied") {
                this[key] = o[key];
            }
        }
    }

    //
    // Spawn a new non-unique item!
    /** @returns {Item} */
    createItem() {
        const item = new Item();

        for (const [key, value] of Object.entries(this)) {
            item[key] = value;
        }

        item.blueprintId = this.blueprintId;

        return item;
    }
}

/**
 * An object of this class represents a single instance
 * of a given item in the game. It can be a shortsword, or a potion,
 * or another, different shortsword that belongs to another character, etc.
 *
 * If a character has two identical potions of healing, they are each represented
 * by an object of this class.
 * The only notable tweak to this rule is collective items like quivers that have
 * arrows that are consumed. In this case, each individual arrow is not tracked
 * as its own entity, only the quiver is tracked.
 */
export class Item extends ItemAttributes {}
