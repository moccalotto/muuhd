//   ____ _                          _
//  / ___| |__   __ _ _ __ __ _  ___| |_ ___ _ __
// | |   | '_ \ / _` | '__/ _` |/ __| __/ _ \ '__|
// | |___| | | | (_| | | | (_| | (__| ||  __/ |
//  \____|_| |_|\__,_|_|  \__,_|\___|\__\___|_|
//  ____                _
// / ___|  ___  ___  __| | ___ _ __
// \___ \ / _ \/ _ \/ _` |/ _ \ '__|
//  ___) |  __/  __/ (_| |  __/ |
// |____/ \___|\___|\__,_|\___|_|
// ------------------------------------------------
import { Character } from "../models/character.js";
import { gGame } from "../models/globals.js";
import { Player } from "../models/player.js";
import { isIdSane } from "../utils/id.js";

// stupid convenience hack that only works if we only have a single Game in the system.
// Which we easily could have.!!
let roll = {};

export class CharacterSeeder {
    constructor() {
        // stupid convenience hack that only works if we only have a single Game in the system.
        // Which we easily could have.!!
        roll = {
            d: (max, min = 1) => {
                return gGame.random.within(min, max);
            },
            d6: () => {
                return gGame.random.within(1, 6);
            },
            d8: () => {
                return gGame.random.within(1, 8);
            },
        };
    }

    /**
     * @param {Character} character
     * @param {...string} itemBlueprintIds
     */
    addItemsToCharacter(character, ...itemBlueprintIds) {
        for (const id of itemBlueprintIds) {
            const blueprint = gGame.getItemBlueprint(id);
            if (!blueprint) {
                throw new Error(`No blueprint found for id: ${id}`);
            }
            const item = blueprint.createItem();
            character.addItem(item);
        }
    }

    /**
     * @param {Character} character
     * @param {...string} skills
     */
    addSkillsToCharacter(character, ...skills) {
        for (const skill of skills) {
            if (!isIdSane(skill)) {
                throw new Error(`Skill id >>${skill}<< is insane!`);
            }
            character.skills.add(skill);
        }
    }

    /**
     * Foundation function
     * @name FoundationFunction
     * @function
     * @param {Character} The character to which we apply this foundation.
     */

    createCharacter() {
        const c = new Character();
        //
        // Initializing
        //

        // Rolling skills

        c.name =
            gGame.random.oneOf("sir ", "madam ", "mister ", "miss ", "", "", "") + // prefix
            "random " + // name
            gGame.random.get().toString(); // suffix

        c.awareness = roll.d6() + 2;
        c.grit = roll.d6() + 2;
        c.knowledge = roll.d6() + 2;
        c.magic = roll.d6() + 2;
        c.meleeCombat = roll.d6() + 2;
        c.rangedCombat = roll.d6() + 2;
        c.skulduggery = roll.d6() + 2;

        this.applyAncestry(c);
        this.applyFoundation(c);

        return c;
    }

    applyAncestry(c) {
        let ancestryId = roll.d8();
        switch (ancestryId) {
            case 1:
                c.ancestry = "human";
                // Humans get +1 to all skills
                c.awareness++;
                c.grit++;
                c.knowledge++;
                c.magic++;
                c.meleeCombat++;
                c.rangedCombat++;
                c.skulduggery++;
                break;
            case 2:
                c.ancestry = "dwarven";
                c.meleeCombat = Math.max(c.meleeCombat, 10);
                break;
            case 3:
                c.ancestry = "elven";
                c.rangedCombat = Math.max(c.rangedCombat, 10);
                break;
            case 4:
                c.ancestry = "giant";
                c.meleeCombat = Math.max(c.grit, 10);
                break;
            case 5:
                c.ancestry = "gnomish";
                c.meleeCombat = Math.max(c.awareness, 10);
                break;
            case 6:
                c.ancestry = "primordial";
                c.meleeCombat = Math.max(c.magic, 10);
                break;
            case 7:
                c.ancestry = "draconic";
                c.meleeCombat = Math.max(c.knowledge, 10);
                break;
            case 8:
                c.ancestry = "demonic";
                c.meleeCombat = Math.max(c.skulduggery, 10);
                break;
            default:
                throw new Error(`Logic error, ancestry d8() roll of ${ancestryId} was out of scope"`);
        }
    }

    /**
     * Create characters for the given player
     *
     * The characters are automatically added to the player's party
     *
     * @param {Player} player
     * @param {number} partySize
     *
     * @return {Character[]}
     */
    createParty(player, partySize) {
        //
        for (let i = 0; i < partySize; i++) {
            player.addCharacter(
                this.createCharacter(player), //
            );
        }
    }

    /**
     * @param {Character} c
     * @param {string|number} Foundation to add to character
     */
    applyFoundation(c, foundation = ":random") {
        switch (foundation) {
            case ":random":
                return this.applyFoundation(c, roll.d(3));

            //
            // Brawler
            // ------
            case 1:
            case ":brawler":
                c.foundation = "Brawler";
                c.skills.add(":armor.light");
                c.silver = 40;
                c.maxHitPoints = c.currentHitPoints = 15;
                c.itemSlots = 7;
                c.meleeCombat = Math.max(c.meleeCombat, 10);
                c.knowledge = Math.min(c.knowledge, 10);

                this.addItemsToCharacter(
                    c, //
                    ":armor.light.studded_leather",
                    ":weapon.weird.spiked_gauntlets",
                );

                this.addSkillsToCharacter(c, ":weapon.weird.spiked_gauntlets");

                break;

            //
            // DRUID
            // ------
            case 2:
            case ":druid":
                c.foundation = "Druid";
                c.silver = 40;
                c.maxHitPoints = this.currentHitPoints = 15;
                c.itemSlots = 7;
                c.meleeCombat = Math.max(this.meleeCombat, 10);
                c.knowledge = Math.min(this.knowledge, 10);
                this.addItemsToCharacter(
                    c, //
                    ":armor.light.leather",
                    ":weapon.light.sickle",
                    ":kit.poisoners_kit",
                    ":kit.healers_kit",
                );
                this.addSkillsToCharacter(
                    c, //
                    ":armor.light.sleather",
                    ":armor.light.hide",
                    ":weapon.light.sickle",
                );
                break;
            case 3:
            case ":fencer":
                c.foundation = "Fencer";

                //
                // Stats
                c.maxHitPoints = c.currentHitPoints = 15;
                c.meleeCombat = Math.max(c.meleeCombat, 10);
                c.magic = Math.min(c.magic, 10);

                //
                // Skills
                this.addSkillsToCharacter(
                    c, //
                    ":weapon.style.two_weapons",
                    ":armor.light",
                );

                //
                // Gear
                c.silver = 40;
                c.itemSlots = 5;
                this.addItemsToCharacter(
                    c, //
                    ":armor.light.leather",
                    ":weapon.light.rapier",
                    ":weapon.light.dagger",
                );
                break;
            case 4:
            case ":guard":
                c.foundation = "Guard";

                //
                // Stats
                c.maxHitPoints = c.currentHitPoints = 15;
                c.meleeCombat = Math.max(c.meleeCombat, 10);
                c.magic = Math.min(c.magic, 10);

                //
                // Skills
                this.addSkillsToCharacter(
                    c, //
                    ":armor.medium",
                    ":weapon.weird.halberd",
                );

                //
                // Gear
                c.silver = 50;
                c.itemSlots = 5;
                this.addItemsToCharacter(
                    c, //
                    ":armor.medium.breastplate",
                    ":weapon.weird.halberd",
                    ":lighting.bulls_eye_lantern",
                    ":misc.signal_whistle",
                    ":maps.area.hvedstad",
                );
                break;

            /*


//
//---------------------------------------------------------------------------------------
//HEADLINE: GUARD
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Guard

|[unstyled]
* Medium Armor

|[unstyled]
* Halberd
* Bull's Eye Lantern
* Signal Whistle
* Map of Local Area
* 50 Silver Pieces

|[unstyled]
* 10 Hit Points
* 5 Item Slots
* Awareness raised to 10
* Melee Combat raised to 10
* Skulduggery limited to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: MAGICIAN
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Magician

|[unstyled]
* None

|[unstyled]
* Tier 2 Wand with random spell.
* Tier 1 Wand with random spell.
* 10 Silver Pieces

|[unstyled]
* 10 Hit Points
* 6 Item Slots
* Melee Combat limited to 10
* Ranged Combat limited to 5
* Magic raised to 10
* Grit limited to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: MEDIC
//---------------------------------------------------------------------------------------
| {counter:foundation}

|Medic

|[unstyled]
* Light Armor
* Medium Armor

|[unstyled]
* Club
* Sling
* 3 Daggers
* Healer's Kit
* 40 Silver Pieces

|[unstyled]
* 10 Hit Points
* 6 Item Slots

//
//---------------------------------------------------------------------------------------
//HEADLINE: RECKLESS
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Reckless

|[unstyled]

|[unstyled]
* Great Axe
* 50 Silver Pieces

|[unstyled]
* 20 Hit Points
* 7 Item Slots
* Melee Combat raised to 10
* Awareness raised to 10
* Grit raised to 10
* Magic limited to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: ROVER
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Rover

|[unstyled]
* Light Armor

|[unstyled]
* Leather Armor
* Short Sword
* Longbow
* Snare Maker's Kit
* 25 Silver Pieces

|[unstyled]
* 10 Hit Points
* 5 Item Slots
* Magic Reduced to 10
* Awareness raised to 10
* Ranged Combat raised to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: SKIRMISHER
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Skirmisher

|[unstyled]
* Light Armor
* Shields

|[unstyled]
* Spear
* Small Shield
* 50 Silver Pieces


|[unstyled]
* 15 Hit Points
* 6 Item Slots
* Melee Combat raised to 10
* Awareness raised to 10
* Skulduggery raised to 10
* Grit raised to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: SNEAK
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Sneak

|[unstyled]
* Light Armor

|[unstyled]
* 3 daggers
* Small Crossbow
* Poisoner's Kit
* 30 Silver Pieces


|[unstyled]
* 10 Hit Points
* 6 Item Slots
* Melee Combat raised to 10
* Awareness raised to 10
* Skulduggery raised to 10
* Grit raised to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: SPELLSWORD
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Spellsword

|[unstyled]

|[unstyled]
* Tier 1 Wand with random spell.
* Longsword
* 30 Silver Pieces

|[unstyled]
* 12 Hit Points
* 5 Item Slots
* Melee Combat raised to 10
* Ranged Combat limited to 10
* Magic raised to 10
* Skulduggery limited to 10
* Grit raised to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: SPELUNKER
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Spelunker

|[unstyled]
* None

|[unstyled]
* Spear
* Caltrops
* Bull's Eye Lantern
* Map Maker's Kit
* Chalk
* Caltrops
* 5 Silver Pieces

|[unstyled]
* 10 Hit Points
* 4 Item Slots
* Awareness raised to 10
* Melee Combat raised to 10
* Skulduggery raised to 10
* Magic limited to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: SPIT'N'POLISH
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Spit'n' Polish

|[unstyled]
* Heavy Armor
* Shield

|[unstyled]
* Half-Plate
* Large Shield
* Long Sword
* 10 Silver Pieces

|[unstyled]
* 10 Hit Points
* 2 Item Slots
* Melee Combat raised to 10
* Magic Reduced to 6
* Awareness Reduced to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: STILETTO
//---------------------------------------------------------------------------------------
| {counter:foundation}

| Stiletto

|[unstyled]
* Light Armor

|[unstyled]
* Padded Armor
* 3 Daggers
* Small Crossbow
* Poisoner's Kit
* 20 Silver Pieces

|[unstyled]
* 10 Hit Points
* 5 Item Slots
* Melee Combat raised to 10
* Ranged Combat raised to 10
* Awareness raised to 10
* Magic limited to 6
* Knowledge limited to 10

//
//---------------------------------------------------------------------------------------
//HEADLINE: Tinkerer
//---------------------------------------------------------------------------------------
| {counter:foundation}

|Tinkerer

|[unstyled]
* Light Armor

|[unstyled]
* Studded Leather
* Wrench (club)
* Tinkerer's Kit
* 30 Silver Pieces

|[unstyled]
* 10 Hit Points
* 5 Item Slots
* Awareness raised to 10
* Knowledge raised to 10

                    */
            //
            // WTF ?!
            // ------
            default:
                throw new Error(`Invalid foundation id ${foundation}`);
        }
    }
}

if (Math.PI < 0 && Player) {
    ("STFU Linda");
}
