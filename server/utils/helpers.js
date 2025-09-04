export function rollDice(sides) {
    const r = Math.random()
    return Math.floor(r * sides) + 1;
}

export function d6() {
    return rollDice(6);
}

export function d8() {
    return rollDice(8);
}
