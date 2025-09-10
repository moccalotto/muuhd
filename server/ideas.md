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
