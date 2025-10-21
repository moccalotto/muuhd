import { gGame } from "../models/globals.js";

//
//  ___ _                   _____                    _       _
// |_ _| |_ ___ _ __ ___   |_   _|__ _ __ ___  _ __ | | __ _| |_ ___  ___
//  | || __/ _ \ '_ ` _ \    | |/ _ \ '_ ` _ \| '_ \| |/ _` | __/ _ \/ __|
//  | || ||  __/ | | | | |   | |  __/ | | | | | |_) | | (_| | ||  __/\__ \
// |___|\__\___|_| |_| |_|   |_|\___|_| |_| |_| .__/|_|\__,_|\__\___||___/
//                                            |_|
//

export class ItemSeeder {
    seed() {
        // __        __
        // \ \      / /__  __ _ _ __   ___  _ __  ___
        //  \ \ /\ / / _ \/ _` | '_ \ / _ \| '_ \/ __|
        //   \ V  V /  __/ (_| | |_) | (_) | | | \__ \
        //    \_/\_/ \___|\__,_| .__/ \___/|_| |_|___/
        //                     |_|
        //-------------------------------------------------------
        gGame.addItemBlueprint(":weapon.light.dagger", {
            name: "Dagger",
            description: "Small shady blady",
            itemSlots: 0.5,
            damage: 3,
            melee: true,
            ranged: true,
            specialEffect: ":effect.weapon.fast",
        });

        gGame.addItemBlueprint(":weapon.light.sickle", {
            name: "Sickle",
            description: "For cutting nuts, and branches",
            itemSlots: 1,
            damage: 4,
            specialEffect: ":effect.weapon.sickle",
        });

        gGame.addItemBlueprint(":weapon.weird.spiked_gauntlets", {
            name: "Spiked Gauntlets",
            description: "Spikes with gauntlets on them!",
            itemSlots: 1,
            damage: 5,
            specialEffect: "TBD",
        });

        gGame.addItemBlueprint(":weapon.light.rapier", {
            name: "Rapier",
            description: "Fancy musketeer sword",
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
        gGame.addItemBlueprint(":armor.light.studded_leather", {
            name: "Studded Leather Armor",
            description: "Padded and hardened leather with metal stud reinforcement",
            itemSlots: 3,
            specialEffect: "TBD",
            armorHitPoints: 10,
        });
        gGame.addItemBlueprint(":armor.light.leather", {
            name: "Leather Armor",
            description: "Padded and hardened leather",
            itemSlots: 2,
            specialEffect: "TBD",
            armorHitPoints: 6,
        });

        //  _  ___ _
        // | |/ (_) |_ ___
        // | ' /| | __/ __|
        // | . \| | |_\__ \
        // |_|\_\_|\__|___/
        // -------------------
        gGame.addItemBlueprint(":kit.poisoners_kit", {
            name: "Poisoner's Kit",
            description: "Allows you to create poisons that can be applied to weapons",
            itemSlots: 2,
            specialEffect: "TBD",
            count: 20,
            maxCount: 20,
        });

        gGame.addItemBlueprint(":kit.healers_kit", {
            name: "Healer's Kit",
            description: "Allows you to heal your teammates outside of combat",
            itemSlots: 2,
            specialEffect: "TBD",
            count: 20,
            maxCount: 20,
        });
    }
}
