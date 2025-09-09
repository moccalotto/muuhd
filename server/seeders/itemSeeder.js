import { Game } from "../models/game.js";
import { ItemTemplate } from "../models/item.js";

//
//  ___ _                   _____                    _       _
// |_ _| |_ ___ _ __ ___   |_   _|__ _ __ ___  _ __ | | __ _| |_ ___  ___
//  | || __/ _ \ '_ ` _ \    | |/ _ \ '_ ` _ \| '_ \| |/ _` | __/ _ \/ __|
//  | || ||  __/ | | | | |   | |  __/ | | | | | |_) | | (_| | ||  __/\__ \
// |___|\__\___|_| |_| |_|   |_|\___|_| |_| |_| .__/|_|\__,_|\__\___||___/
//                                            |_|
//
// Seed the Game.itemTemplate store
export class ItemSeeder {

    /** @param {Game} game */
    constructor(game) {
        this.game = game;
    }

    seed() {

        // __        __
        // \ \      / /__  __ _ _ __   ___  _ __  ___
        //  \ \ /\ / / _ \/ _` | '_ \ / _ \| '_ \/ __|
        //   \ V  V /  __/ (_| | |_) | (_) | | | \__ \
        //    \_/\_/ \___|\__,_| .__/ \___/|_| |_|___/
        //                     |_|
        //-------------------------------------------------------
        this.game.createItemTemplate("weapons.light.dagger", {
            name: "Dagger",
            description: "Small shady blady",
            itemSlots: 0.5,
            damage: 3,
            melee: true,
            ranged: true,
            specialEffect: "effects.weapons.fast",
        });
        this.game.createItemTemplate("weapons.light.sickle", {
            name: "Sickle",
            description: "For cutting nuts, and branches",
            itemSlots: 1,
            damage: 4,
            specialEffect: "effects.weapons.sickle",
        });
        this.game.createItemTemplate("weapons.light.spiked_gauntlets", {
            name: "Spiked Gauntlets",
            description: "Spikes with gauntlets on them!",
            itemSlots: 1,
            damage: 5,
            specialEffect: "TBD",
        });


        //     _
        //    / \   _ __ _ __ ___   ___  _ __ ___
        //   / _ \ | '__| '_ ` _ \ / _ \| '__/ __|
        //  / ___ \| |  | | | | | | (_) | |  \__ \
        // /_/   \_\_|  |_| |_| |_|\___/|_|  |___/
        // ---------------------------------------
        //
        this.game.createItemTemplate("armors.light.studded_leather", {
            name: "Studded Leather",
            description: "Padded and hardened leather with metal stud reinforcement",
            itemSlots: 3,
            specialEffect: "TBD",
        });

        console.log(this.game._itemTemplates);
    }
}

