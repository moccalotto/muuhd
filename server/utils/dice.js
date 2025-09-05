export function withSides(sides) {
    const r = Math.random();
    return Math.floor(r * sides) + 1;
}

export function d6() {
    return withSides(6);
}

export function d8() {
    return withSides(8);
}
