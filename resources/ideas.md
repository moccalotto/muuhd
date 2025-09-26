```
 ___ ____  _____    _    ____
|_ _|  _ \| ____|  / \  / ___|
 | || | | |  _|   / _ \ \___ \
 | || |_| | |___ / ___ \ ___) |
|___|____/|_____/_/   \_\____/
-------------------------------
```

# GARBAGE COLLECTORS

At night, the Garbage Collectors (smelly gnolls) or other Janitor Mobs come out
to remove any loose items or dead characters that may be lying around. They
are quite tough.

These janitor mobs clean up almost everywhere except Instances (that clean up themselves)
and players' homes, prisons, and other VIP locations.

They never trigger quests or events where they go, but:

- they can interact with adventurers (they are quite aggressive, and may attack unprovoked, maybe sneak past)
- they can interact with each other, but mostly do so if there are PCs nearby.

# ATTRITION

Even when a player is offline, their characters have to pay rent on their homes
or room and board in an inn, or they can chance it in the wilderness.

If they run out of money or rations, there is a small chance each day that the
characters will be garbage collected.

The sum that needs paying while offline not very large though.

# CHAT SPELL

You can buy a spell that lets you initiate a secure and encrypted group chat
with other players.

The person who casts the spell generates a private key and sends the public key
to the others in the chat. Each recipient then generates a one-time symmetric
key and sends it securely (via the caster's public key) to the caster. The
caster then generates a "group chat key" and sends it to each recipient via
their one-time key.

Any chats via the spell from then on is encrypted with the "group chat key".

All parties throw away the group chat key when the spell ends.

Each group chat has a name.

```
 ____                           _
| __ ) _   _  __ _  __ _  ___  | |__  _   _  __ _  __ _  ___
|  _ \| | | |/ _` |/ _` |/ _ \ | '_ \| | | |/ _` |/ _` |/ _ \
| |_) | |_| | (_| | (_| |  __/ | |_) | |_| | (_| | (_| |  __/
|____/ \__, |\__, |\__, |\___| |_.__/ \__, |\__, |\__, |\___|
       |___/ |___/ |___/              |___/ |___/ |___/

```

# CONSTRUCTION / BUILDING

- You can build a house / mansion / castle / wizard tower / underdark / cave / wattever.
- You can invite other players oveer for a tjat.
- You can build portals to other dimensions (instances),
  and you can allow other players to try it out.

```
 ____                                       __  __           _
|  _ \ _   _ _ __   __ _  ___  ___  _ __   |  \/  | ___   __| | ___  ___
| | | | | | | '_ \ / _` |/ _ \/ _ \| '_ \  | |\/| |/ _ \ / _` |/ _ \/ __|
| |_| | |_| | | | | (_| |  __/ (_) | | | | | |  | | (_) | (_| |  __/\__ \
|____/ \__,_|_| |_|\__, |\___|\___/|_| |_| |_|  |_|\___/ \__,_|\___||___/
                   |___/
```

- `Caves`
    - GameMode = _Spelunking_: Sir Whalemeat the Thurd is Spelunking in the Caves of Purh.
    - Played like `Rogue`
    - Procedurally (pre-)generated caves (Game of Life? automata?)
    - Turn based: you take one action, and everything else gets one `tick`.
    - 1 Location == 1 cave
- `Donjons`
    - GameMode = _Crawling_: Lady Gurthie Firefoot is Crawling the Donjons of Speematoforr.
    - Played like `Knights of Pen and Paper`
        - WebGL: Actual rendered 3d, but black and white.
        - Texture pack is just ascii text (TEXTures).
            - Possibly Procedurally generated
            - Most likely like this: https://www.youtube.com/watch?v=D1jLK4TG6O4&list=LL
        - Animations like `Stonekeep` - only showing animation when the player moves.
        - Monsters are just outlines of monster shapes, shaded with variably-sized letters
          that spell out the monster's name.
    - Procedurally (pre-)generated dungeons
    - Every time you enter a non-explored space, you roll a die, and see what happens.
    - Combat is like `Dark Queen of Krynn` (i.e. third person semi-iso)
    - 1 Location == 1 donjon room/area
    - BSP (binary space partition) https://www.youtube.com/watch?v=TlLIOgWYVpI&t=374s

- `Overland`
    - GameMode = _Traveling_: Swift Dangledonk the Slow is Traveling the Marshes of Moohfaahsaah
    - Travel is like `Rogue`
    - Combat is like `Dark Queen of Krynn`
    - Static terrain.
    - Random encounters.
    - Each encounter has a randomly generated mini map (which is just monsters and a few obstacles)
    - 1 Location == 1 area / screen
- `Settlements`
    - GameMode = _Sojourning_: Swingleding the Mage is Sojourning in the City of Hovedstad.
    - may be played like MUDs (`go west`, `go to town square`, etc.).
    - Static (mostly)
    - Combat is like `Dark Queen of Krynn`
    - 1 Location == 1 area (an inn, etc.)
- `Dwelling`
    - GameMode = _Hanging Out_: Wendlegloom Uklimuck is Hanging Out in The House of the Sitting Sun.
    - Homes that players can own or build.
    - Like `Rogue` but with tweaks such as detailed descriptions
      of the cool stuff the players have done with the room.

```
//  __  __                         _     ___
// |  \/  | ___  _ __   ___ _   _ | |   ( _ )
// | |\/| |/ _ \| '_ \ / _ \ | | / __)  / _ \/\
// | |  | | (_) | | | |  __/ |_| \__ \ | (_>  <
// |_|  |_|\___/|_| |_|\___|\__, (   /  \___/\/
//                          |___/ |_|
//  _____
// | ____|_ __   ___ ___  _ __   ___  _ __ ___  _   _
// |  _| | '_ \ / __/ _ \| '_ \ / _ \| '_ ` _ \| | | |
// | |___| | | | (_| (_) | | | | (_) | | | | | | |_| |
// |_____|_| |_|\___\___/|_| |_|\___/|_| |_| |_|\__, |
//                                              |___/
```

- `VAT (Very Awful Tax)`
    - Applies only to transfers of valuables between parties/players.
    - Its 10%
    - Also, players cannot give each other items, they must sell them for a fair price (50% of worth)

- `Financial Obligations`
    - A party can have between 0 and 255 FOs.
    - An obligation of X (where X is higher than 0) means that `X * 100 / 255` percent of all gold is subtracted
        - When you find it
        - When you sell an item
        - When you acquire gold from quests, jobs, services, etc.
        - When another player/party gives or lends you money
    - Your obligation can reach 255, but never go above. This means that, if you have an obligation if `X`, and
      means you cannot do something (hire a hireling, take out a loan, or buy a BOO) that has an FO
      level higher than `255-X`;
    - FO only affects gold, not items, gems, etc, but it will affect you once you try to sell those items.

- `Hirelings`
    - Can be hired in taverns
    - Can be exchanged with other players?
    - Often cost money to buy
    - Often come with an FO that only goes away when they leave the party.

- `Bases of Operation (BOOs)`
    - Can be purchased in cities.
    - Cost initial large amount of gold
    - Always comes with some level of FO that
      only goes away if you sell the BOO or if it is destroyed by
      baddies.

- `Loans`
    - Gives you cash in hand.
    - Comes with an FO that only goes away when you pay back the loan in its
      entirety. The obligation is not lowered, even if you pay back 99.9% of the
      loan.

- `Artifacts`
    - Certain magical items come with FOs.
      Because you rent them rather than own them.

- `Pleading`
    - Certain monsters (like Dragons, Gins, Dark Lord Wizards, Bandit Leaders,
      etc) will let you walk away in exchange for a certain level of FO. This
      only goes away when you kill the monster.
    - Note that ordinary bandits will not let you live - they are not clever
      enough to see your potential.
    - Pleading only works if you have more free FOs than the level of the
      monster.
    - Pleading will usually cost you either 80% of your free FOs, or twice the
      level of the monster, whichever is lower.

```
 ____  _   _ _   _ ____
|  _ \| | | | \ | / ___|
| |_) | | | |  \| \___ \
|  __/| |_| | |\  |___) |
|_|    \___/|_| \_|____/
```

- Waif-Unction Collabs
- Waify Collapse
- Drag-on lance
