export function dice(sides) {
    const r = Math.random();
    return Math.floor(r * sides) + 1;
}

export function d6() {
    return dice(6);
}

export function d8() {
    return dice(8);
}
