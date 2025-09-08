import { cleanName } from "../utils/id.js";

/**
 * Item templates are the built-in basic items of the game.
 * A character cannot directly own one of these items,
 * they can only own CharacterItems, and ItemTemplates can be used to
 * generate these CharacterItems.
 */
export class ItemTemplate {
    _id;
    _name;
    _description;
    _itemSlots;

    /** @type {string} Item's machine-friendly name */
    get id() {
        return this._id;
    }

    /** @type {string} Item's human-friendly name */
    get name() {
        return this._name;
    }

    /** @type {string} Item's Description */
    get description() {
        return this._description;
    }

    /** @type {number} Number of Item Slots taken up by this item. */
    get itemSlots() {
        return this._itemSlots;
    }

    /**
     * Constructor
     *
     * @param {string} name. The Item's Name.
     * @param {number} itemSlots number of item slots the item takes up in a character's inventory.
     * @param {string} description Item's detailed description.
     * @param {string=} id Item's machine-friendly name.
     */
    constructor(name, itemSlots, description, id) {
        if (typeof name !== "string") {
            throw new Error("Name must be a string, but " + typeof name + " given.");
        }
        if (typeof description === "undefined") {
            description = "";
        }
        if (typeof description !== "string") {
            throw new Error("Name must be a string, but " + typeof name + " given.");
        }
        if (!Number.isFinite(itemSlots)) {
            throw new Error("itemSlots must be a finite number!");
        }
        if (typeof id === "undefined") {
            id = cleanName(name);
        }
        if (typeof id !== "string") {
            throw new Error("id must be a string!");
        }

        this._name = name;
        this._id = id;
        this._itemSlots = Number(itemSlots);
        this._description = "";
    }

    createItem() {
        return new ChracterItem(this._id, this._name, this._description, this._itemSlots);
    }

    static getOrCreate(id, name, description, itemSlots) {
    }

    static seed() {
        this
    }
}

/**
 * Characters can only own CharacterItems.
 *
 * If two characters have a short sword, each character has a CharacterItem
 * with the name of Shortsword and with the same properties as the orignial Shortsword ItemTemplate.
 *
 * If a character picks up a Pickaxe in the dungeon, a new CharacterItem is spawned and injected into
 * the character's Equipment Map. If the item is dropped/destroyed/sold, the CharacterItem is removed from
 * the character's Equipment Map, and then deleted from memory.
 *
 * If a ChracterItem is traded away to another character, The other character inserts a clone of this item
 * into their equipment map, and the item is then deleted from the previous owner's equipment list.
 * This is done so we do not have mulltiple characters with pointers to the same item - we would rather risk
 * dupes than wonky references.
 *
 * An added bonus is that the character can alter the name and description of the item.
 *
 * Another bonus is, that the game can spawn custom items that arent even in the ItemTemplate Set.
 */
export class CharacterItem {
    /** @type {string?} The unique name if the ItemTemplate this item is based on. May be null. */
    templateItemId; // We use the id instead of a pointer, could make garbage collection better.

    /** @type {string} The player's name for this item. */
    name;

    /** @type {string} The player's description for this item. */
    description;

    /** @type {number} Number of item slots taken up by this item. */
    itemSlots;

    constructor(templateItemId, name, description, itemSlots) {
        this.templateItemId = templateItemId;
        this.name = name;
        this.description = description;
        this.itemSlots = itemSlots;
    }
}
