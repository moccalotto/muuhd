/**
 * Item templates are the built-in basic items of the game.
 * A character cannot directly own one of these items,
 * they can only own CharacterItems, and ItemTemplates can be used to
 * generate these CharacterItems.
 */
export class ItemTemplate {
    /** @constant @readonly @type {string} Item's machine-friendly name */
    id;

    /** @constant @readonly @type {string} Item's human-friendly name */
    name;

    /** @constant @readonly @type {string} Item's Description */
    description;

    /** @constant @readonly @type {number} Number of Item Slots taken up by this item. */
    itemSlots;

    /** @constant @readonly @type {number?} How much damage (if any) does this item deal */
    damage;

    /** @constant @readonly @type {string?} Which special effect is triggered when successfull attacking with this item? */
    specialEffect;

    /** @constant @readonly @type {boolean?} Can this item be used as a melee weapon? */
    melee;

    /** @constant @readonly @type {boolean?} Can this item be used as a ranged weapon? */
    ranged;

    /** @constant @readonly @type {string?} Type of ammo that this item is, or that this item uses */
    ammoType;

    /**
     * Constructor
     *
     * @param {string=null} id Item's machine-friendly name.
     * @param {string} name. The Item's Name.
     * @param {number} itemSlots number of item slots the item takes up in a character's inventory.
     */
    constructor(id, name, itemSlots) {

        if (typeof id !== "string" || id.length < 1) {
            throw new Error("id must be a string!");
        }

        if (typeof name !== "string" || name.length < 1) {
            throw new Error("Name must be a string, but " + typeof name + " given.");
        }

        if (!Number.isFinite(itemSlots)) {
            throw new Error("itemSlots must be a finite number!");
        }

        this.name = name;
        this.id = id;
        this.itemSlots = Number(itemSlots);
    }

    //
    // Spawn a new item!
    /** @returns {Item} */
    createItem() {
        return new ChracterItem(
            this.id,
            this.name,
            this.description,
            this.itemSlots,
        );
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
    /** @type {ItemTemplate|null} The template that created this item. Null if no such template exists [anymore]. */
    itemTemplate; // We use the id instead of a pointer, could make garbage collection better.

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
