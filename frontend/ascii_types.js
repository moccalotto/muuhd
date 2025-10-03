export const PI_OVER_TWO = Math.PI / 2;

/**
 * Enum Cardinal Direction (east north west south)
 * @constant @readonly @enum {number}
 */
export const Orientation = {
    /** @constant @readonly @type {number} */
    WEST: 0,
    /** @constant @readonly @type {number} */
    SOUTH: 1,
    /** @constant @readonly @type {number} */
    EAST: 2,
    /** @constant @readonly @type {number} */
    NORTH: 3,
};

/**
 * Enum Relative Direction (forward, left, right, backwards)
 * @constant @readonly @enum {number}
 */
export const RelativeMovement = {
    FORWARD: 0,
    LEFT: 1,
    BACKWARD: 2,
    RIGHT: 3,
};

export class Vector2i {
    constructor(x = 0, y = 0) {
        this.x = x | 0; // force int
        this.y = y | 0;
    }

    clone() {
        return new Vector2i(this.x, this.y);
    }

    // add another vector (mutates)
    add(v) {
        this.x = (this.x + v.x) | 0;
        this.y = (this.y + v.y) | 0;
        return this;
    }

    // subtract another vector (mutates)
    sub(v) {
        this.x = (this.x - v.x) | 0;
        this.y = (this.y - v.y) | 0;
        return this;
    }

    // multiply by scalar (mutates)
    mul(s) {
        this.x = (this.x * s) | 0;
        this.y = (this.y * s) | 0;
        return this;
    }

    // length squared (int-safe)
    lengthSq() {
        return (this.x * this.x + this.y * this.y) | 0;
    }

    // temporary result (non-mutating)
    added(v) {
        return this.clone().add(v);
    }
    subbed(v) {
        return this.clone().sub(v);
    }
    mulled(s) {
        return this.clone().mul(s);
    }

    // which cardinal direction are we in?
    orientation() {
        if (this.y === 0) {
            if (this.x > 0) {
                return 0;
            }

            if (this.x < 0) {
                return 2;
            }
        }
        if (this.x === 0) {
            if (this.y > 0) {
                return 1;
            }

            if (this.y < 0) {
                return 3;
            }
        }
    }

    rotateCW(quarterTurns = 1) {
        quarterTurns = (quarterTurns + 4) % 4;
        if (quarterTurns === 0) {
            return this;
        }
        if (quarterTurns === 1) {
            return this.rotate270();
        }
        if (quarterTurns === 2) {
            return this.rotate180();
        }
        if (quarterTurns === 3) {
            return this.rotate90();
        }

        throw new Error("Logic error. How did we end up here?");
    }
    rotateCCW(quarterTurns = 1) {
        quarterTurns = (quarterTurns + 4) % 4;
        if (quarterTurns === 0) {
            return this;
        }

        if (quarterTurns === 1) {
            return this.rotate90();
        }
        if (quarterTurns === 2) {
            return this.rotate180();
        }
        if (quarterTurns === 3) {
            return this.rotate270();
        }

        throw new Error("Logic error. How did we end up here?");
    }

    // === rotations (mutating) ===
    rotate90() {
        // counter-clockwise
        const x = this.x | 0;
        this.x = -this.y | 0;
        this.y = x | 0;
        return this;
    }

    rotate180() {
        this.x = -this.x | 0;
        this.y = -this.y | 0;
        return this;
    }

    rotate270() {
        // clockwise
        const x = this.x | 0;
        this.x = this.y | 0;
        this.y = -x | 0;
        return this;
    }

    // === non-mutating versions ===
    rotated90() {
        return this.clone().rotate90();
    }
    rotated180() {
        return this.clone().rotate180();
    }
    rotated270() {
        return this.clone().rotate270();
    }
    rotatedCW(quarterTurns) {
        return this.clone().rotateCW(quarterTurns);
    }
    rotatedCCW(quarterTurns) {
        return this.clone().rotateCCW(quarterTurns);
    }

    angle() {
        return Math.atan2(this.y, this.x); // radians
    }

    angleTo(v) {
        const a = this.angle();
        const b = v.angle();

        let d = (b - a) % (2 * Math.PI);
        if (d < -Math.PI) d += 2 * Math.PI;
        if (d > Math.PI) d -= 2 * Math.PI;

        return d;
    }

    toString() {
        return `[${this.x} , ${this.y}]`;
    }
}
