import { sprintf } from "sprintf-js";
import { Vector2i } from "./vec2.js";
import { AsciiWindow } from "./ascrii_window.js";

const PI_OVER_TWO = Math.PI / 2;

/**
 * Enum Cardinal Direction (east north west south)
 * @constant
 * @readonly
 */
const CardinalDirection = {
    /** @constant @readonly @type {number} Going east increases X */
    EAST: 0,
    /** @constant @readonly @type {number} Going south increases Y */
    SOUTH: 1,
    /** @constant @readonly @type {number} Going west decreases X */
    WEST: 2,
    /** @constant @readonly @type {number} Going south decreases Y */
    NORTH: 3,
};

/**
 * Enum Relative Direction (forward, left, right, backwards)
 * @readonly
 */
const RelativeMovement = {
    FORWARD: 0,
    LEFT: 3,
    BACKWARD: 2,
    RIGHT: 1,
};

class Player {
    _posV = new Vector2i();
    _directionV = new Vector2i(0, 1);

    get x() {
        return this._posV.x;
    }

    get y() {
        return this._posV.y;
    }

    set x(x) {
        this._posV.x = x | 0;
    }

    set y(y) {
        this._posV.y = y | 0;
    }

    get angle() {
        return this._directionV.angle();
    }

    get orientation() {
        return this._directionV.cardinalDirection();
    }

    set orientation(o) {
        //
        // Sanitize o
        o = ((o | 0) + 4) % 4;

        if (o === CardinalDirection.EAST) {
            this._directionV = new Vector2i(1, 0);
            return;
        }
        if (o === CardinalDirection.NORTH) {
            this._directionV = new Vector2i(0, 1);
            return;
        }
        if (o === CardinalDirection.WEST) {
            this._directionV = new Vector2i(-1, 0);
            return;
        }
        if (o === CardinalDirection.SOUTH) {
            this._directionV = new Vector2i(0, -1);
            return;
        }
    }

    withinAABB(maxX, maxY, minX = 0, minY = 0) {
        return this._posV.x >= minX && this._posV.x <= maxX && this._posV.y >= minY && this._posV.y <= maxY;
    }
}

class DungeonCrawler {
    get isAnimating() {
        return this.animation.frames.length > 0;
    }

    constructor() {
        /** @type {number} Number of times per second we poll for controller inputs */
        this.pollsPerSec = 60;
        /** @type {number} */
        this.debounce = 0;

        /** @constant @readonly */
        this.keys = {
            /** @constant @readonly */
            handlers: {},
            /** @constant @readonly */
            pressed: {},
            /** @constant @readonly */
            names: {},
        };

        this.map = {
            /** @readonly height of map */
            width: 0,

            /** @readonly width of map */
            height: 0,

            /**
             * @readonly
             * @type {Uint8Array[]}
             * info about each cell/tile in the map (is it floor, is it a wall, etc.)
             *
             * The number 0 is navigable and has no decoration.
             * The number 1 is not navigable, and is a nondescript wall.
             *
             * 1 bit for navigable
             * 3 bits for cell type decoration / voxel type
             * 2 bits for floor decoration.
             * 2 bits for ceiling decoration.
             */
            cells: [],
        };

        this.animation = {
            /** @constant @readonly @type {number} Number of frames per second used in animations */
            fps: 30,

            /** @constant @readonly number of seconds a typical animation takes */
            duration: 0.7,

            /** Array storing information about each frame of an animation to show */
            frames: [],
        };

        /** @readonly */
        this.rendering = {
            enabled: true,
            ticker: 0,
            maxDepth: 5,
            fov: Math.PI / 3, // 60 degrees, increase maybe?
            view: new AsciiWindow(document.getElementById("viewport"), 120, 40),
        };

        /** @readonly */
        this.minimap = {
            parentElement: document.getElementById("minimap"),
            /** @type {Element[][]} */
            elements: [],
        };

        /**
         * @typedef Player
         * @type {object}
         * @property {number} x integer. Player's x-coordinate on the grid.
         * @property {number} y integer. Player's y-coordinate on the grid.
         */
        this.player = new Player();

        this.setupControls();
        this.setupAnimationLoop();

        this.loadMap();
        this.render(this.player.x, this.player.y, this.player.orientation * PI_OVER_TWO, this.animation.frames.length);
        this.updateCompass();
    }

    loadMap() {
        this.minimap.parentElement.innerHTML = "";

        const mapString = document.getElementById("mapText").value;
        const lines = mapString.trim().split("\n");

        const h = (this.map.height = lines.length);
        const w = (this.map.width = Math.max(...lines.map((line) => line.length)));

        this.map.cells = new Array(h).fill().map(() => new Uint8Array(w));
        this.minimap.elements = new Array(h).fill().map(() => new Array(w));
        this.minimap.parentElement.innerHTML = "";

        for (let y = 0; y < h; y++) {
            //
            const row = document.createElement("div");

            for (let x = 0; x < w; x++) {
                const isFree = lines[y][x] === " ";

                //
                // === Internal map ===
                //
                this.map.cells[y][x] = isFree ? 0 : 1;

                //
                // === Mini Map ===
                //
                const mmElement = document.createElement("span");
                mmElement.textContent = isFree ? " " : "#";
                row.appendChild(mmElement);
                this.minimap.elements[y][x] = mmElement;
            }
            this.minimap.parentElement.appendChild(row);
        }

        // Find a starting position (first open space)
        for (let y = 1; y < this.map.height - 1; y++) {
            for (let x = 1; x < this.map.width - 1; x++) {
                if (this.isWall(x, y)) {
                    continue;
                }
                this.player.x = x;
                this.player.y = y;
                return;
            }
        }
        this.updateMinimap();
    }

    startTurnAnimation(clockwise, quarterTurns = 1) {
        if (this.isAnimating) {
            throw new Error("Cannot start an animation while one is already running");
        }

        if (quarterTurns === 0) {
            return;
        }

        const newDirection = clockwise
            ? this.player._directionV.clone().rotateCW(quarterTurns)
            : this.player._directionV.clone().rotateCCW(quarterTurns);

        const ticks = Math.floor(this.animation.duration * this.animation.fps);
        const startAngle = this.player.angle;
        const slice = this.player._directionV.angleTo(newDirection) / ticks;

        this.animation.frames = [];

        for (let i = 1; i < ticks; i++) {
            this.animation.frames.push([
                this.player.x, //
                this.player.y, //
                startAngle + slice * i, //
            ]);
        }

        this.animation.frames.push([this.player.x, this.player.y, newDirection.angle()]);

        //
        //
        this.player._directionV = newDirection;
        this.updateMinimap();
        this.updateCompass();
    }

    /** @type {RelativeMovement} Direction the player is going to move */
    startMoveAnimation(direction) {
        if (this.isAnimating) {
            throw new Error("Cannot start an animation while one is already running");
        }

        const targetV = this.player._directionV.rotatedCCW(direction | 0).added(this.player._posV);

        if (this.isWall(targetV.x, targetV.y)) {
            this.debounce = (this.pollsPerSec / 5) | 0;
            console.info(
                "bumped into wall at %s (mypos: %s), direction=%d",
                targetV,
                this.player._posV,
                this.player.angle,
            );
            return;
        }

        const ticks = Math.floor(this.animation.duration * this.animation.fps);
        const stepX = (targetV.x - this.player.x) / ticks;
        const stepY = (targetV.y - this.player.y) / ticks;

        this.animation.frames = [];
        for (let i = 1; i < ticks; i++) {
            this.animation.frames.push([
                this.player.x + stepX * i, //
                this.player.y + stepY * i, //
                this.player.angle, //
            ]);
        }
        this.animation.frames.push([targetV.x, targetV.y, this.player.angle]);
        this.player._posV = targetV;
        this.updateMinimap();
        this.updateCompass(); // technically not necessary, but Im anticipating the need + compensating for my bad memory.
    }

    setupControls() {
        this.keys.pressed = {};

        this.keys.handlers = {
            KeyA: () => this.startMoveAnimation(RelativeMovement.LEFT),
            KeyD: () => this.startMoveAnimation(RelativeMovement.RIGHT),
            KeyS: () => this.startMoveAnimation(RelativeMovement.BACKWARD),
            KeyW: () => this.startMoveAnimation(RelativeMovement.FORWARD),
            ArrowUp: () => this.startMoveAnimation(RelativeMovement.FORWARD),
            ArrowDown: () => this.startMoveAnimation(RelativeMovement.BACKWARD),
            ArrowLeft: () => this.startTurnAnimation(true),
            ArrowRight: () => this.startTurnAnimation(false),
            KeyQ: () => this.startTurnAnimation(true),
            KeyE: () => this.startTurnAnimation(false),
        };
        this.keys.names = Object.keys(this.keys.handlers);

        document.addEventListener(
            "keydown",
            (e) => {
                const id = e.code;
                this.keys.pressed[id] = true;
            },
            true,
        );

        document.addEventListener(
            "keyup",
            (e) => {
                const id = e.code;
                this.keys.pressed[id] = false;
            },
            true,
        );

        const ticks = Math.round(1000 / this.pollsPerSec);
        this.keys.interval = setInterval(() => {
            this.handleKeyboardInput();
        }, ticks);
    }

    handleKeyboardInput() {
        if (this.debounce > 0) {
            this.debounce--;
            return;
        }

        if (this.isAnimating) {
            return;
        }

        //
        // Check each key we can handle.
        for (let key of this.keys.names) {
            if (this.keys.pressed[key]) {
                this.debounce = Math.floor(this.animation.fps * this.animation.animationDuration) - 1;
                const keyHandler = this.keys.handlers[key];
                keyHandler();
                return;
            }
        }
    }

    handleAnimation() {
        if (!this.isAnimating) {
            return;
        }

        const [x, y, a] = this.animation.frames.shift();
        const framesLeft = this.animation.frames.length;
        this.render(x, y, a, framesLeft);
    }

    //  _____ ___  ____   ___
    // |_   _/ _ \|  _ \ / _ \ _
    //   | || | | | | | | | | (_)
    //   | || |_| | |_| | |_| |_
    //   |_| \___/|____/ \___/(_)
    // -----------------------------
    // Animation loop
    // requestAnimationFrame(loop);
    // requires using deltaT rather than ticks, etc.
    setupAnimationLoop() {
        const ticks = Math.round(1000 / this.animation.fps);
        this.animation.interval = setInterval(() => this.handleAnimation(), ticks);
    }

    isWall(x, y) {
        let mapX = x | 0;
        let mapY = y | 0;

        if (mapX < 0 || mapX >= this.map.width || mapY < 0 || mapY >= this.map.height) {
            return true;
        }

        return this.map.cells[mapY][mapX] !== 0;
    }

    castRay(camX, camY, camAngle, angleOffset) {
        const rayAngle = camAngle + angleOffset;
        const rayX = Math.cos(rayAngle);
        const rayY = Math.sin(rayAngle);
        const fishEye = Math.cos(angleOffset); // corrects fish-eye effect https://stackoverflow.com/questions/66591163/how-do-i-fix-the-warped-perspective-in-my-raycaster
        // const fishEye = 1;

        let distance = Math.SQRT1_2 / 2;
        let step = 0.0001;

        while (distance < this.rendering.maxDepth) {
            const testX = camX + rayX * distance;
            const testY = camY + rayY * distance;

            if (this.isWall(testX, testY)) {
                return [
                    distance * fishEye,
                    {
                        // testX,
                        // testY,
                        // rayDistance: distance, // the distance the ray traveled, not the distance the object was away from us
                        color: (1 - distance / this.rendering.maxDepth) * 1.0,
                    },
                ];
            }

            distance += step;
        }

        return [this.rendering.maxDepth, "#000"];
    }

    render(x, y, direction) {
        if (!this.rendering.enabled) {
            return false;
        }

        this.rendering.ticker++;

        x += 0.5;
        y += 0.5;

        const h = this.rendering.view.height;
        const w = this.rendering.view.width;

        // const middle = this.rendering.height / 2;
        // Hack to simulate bouncy walking by moving the middle of the screen up and down a bit
        const bounce = Math.sin(this.rendering.ticker / 4) * 0.2;
        const middle = h / 2 + bounce;

        for (let screenX = 0; screenX < w; screenX++) {
            //
            //
            const rayOffset = (screenX / w) * this.rendering.fov - this.rendering.fov / 2;

            //
            // Cast the ray, one ray per column, just like wolfenstein
            const [distance, wall] = this.castRay(x, y, direction, rayOffset);

            //
            // Start drawing
            for (let screenY = 0; screenY < h; screenY++) {
                //
                // Calculate how high walls are at the distance of the ray's intersection
                const wallH = middle / distance;

                //
                // Given the current y-coordinate and distance, are we hitting the ceiling?
                if (screenY < middle - wallH) {
                    this.rendering.view.put(screenX, screenY, "´", "#999");
                    continue;
                }

                //
                // Given the current y-coordinate and distance, are we hitting the floor?
                if (screenY > middle + wallH) {
                    this.rendering.view.put(screenX, screenY, "~", "#b52");
                    continue;
                }

                //
                // We've either hit a wall or the limit of our visibility,
                // So we Determine the color of the pixel to draw.
                const color = wall && wall.color ? wall.color : 1 - distance / this.rendering.maxDepth;

                // TODO: Lerp these characters.
                // const distancePalette = ["█", "▓", "▒", "░", " "];
                const distancePalette = ["#", "%", "+", "÷", " "];
                const char = distancePalette[distance | 0];

                this.rendering.view.put(screenX, screenY, char, color);
            }
        }
        this.rendering.view.commitToDOM();
    }

    updateCompass() {
        //
        //
        // Update the compass
        document.getElementById("compass").textContent = sprintf(
            "%s %s (%d --> %.2f [%dº])",
            this.player._posV,
            Object.keys(CardinalDirection)[this.player.orientation].toLowerCase(),
            this.player.orientation,
            this.player.orientation * PI_OVER_TWO,
            this.player.orientation * 90,
        );
    }

    updateMinimap() {
        if (!this.player.withinAABB(this.map.width - 1, this.map.height - 1)) {
            console.error("Player out of bounds");
            return;
        }

        //
        // Remove the old player symbol
        const playerEl = document.querySelector(".player");
        if (playerEl) {
            playerEl.className = "";
        }

        // This is just for debugging!
        //

        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                this.minimap.elements[y][x].textContent = this.map.cells[y][x] ? "#" : " ";
            }
        }
        // Add the player token to the minimap
        const dirForCSS = Object.keys(CardinalDirection)[this.player.orientation].toLowerCase();
        this.minimap.elements[this.player.y][this.player.x].classList.add("player", dirForCSS);
    }
}

// Start the game
window.game = new DungeonCrawler();
