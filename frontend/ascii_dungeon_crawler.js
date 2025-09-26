import { Vector2i, Orientation, RelativeMovement, PI_OVER_TWO } from "./ascii_types.js";
import { FirstPersonRenderer } from "./ascii_first_person_renderer.js";
import { MiniMapRenderer } from "../ascii_minimap_renderer.js";
import { Texture } from "./ascii_textureloader.js";
import { AsciiWindow } from "./ascii_window.js";
import { TileMap } from "./ascii_tile_map.js";
import eobWallUrl1 from "./eob1.png";
import eobWallUrl2 from "./eob2.png";
import { sprintf } from "sprintf-js";

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
        return this._directionV.orientation();
    }

    set orientation(o) {
        //
        // Sanitize o
        o = ((o | 0) + 4) % 4;

        if (o === Orientation.EAST) {
            this._directionV = new Vector2i(1, 0);
            return;
        }
        if (o === Orientation.NORTH) {
            this._directionV = new Vector2i(0, 1);
            return;
        }
        if (o === Orientation.WEST) {
            this._directionV = new Vector2i(-1, 0);
            return;
        }
        if (o === Orientation.SOUTH) {
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
        return (
            this.animation === undefined ||
            this.animation.targetAngle !== undefined ||
            this.animation.targetX !== undefined ||
            this.animation.targetY !== undefined
        );
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

        /** @readonly @type {TileMap} */
        this.map;

        this.animation = {
            StartTime: undefined,
            StartAngle: undefined,
            StartX: undefined,
            StartY: undefined,
            targetTime: undefined,
            targetAngle: undefined,
            targetX: undefined,
            targetY: undefined,
        };

        /** @readonly */
        this.rendering = {
            enabled: true,
            ticker: 0,
            maxDepth: 5,
            fov: Math.PI / 3, // 60 degrees, increase maybe?
            view: new AsciiWindow(document.getElementById("viewport"), 120, 50),

            /** @type {FirstPersonRenderer} */
            renderer: null,
        };

        /** @readonly @type {MiniMapRenderer} */
        this.minimap;

        /**
         * @typedef Player
         * @type {object}
         * @property {number} x integer. Player's x-coordinate on the grid.
         * @property {number} y integer. Player's y-coordinate on the grid.
         */
        this.player = new Player();

        this.setupControls();

        this.loadMap();
        this.updateCompass();
        this.rendering.view.commitToDOM();
        this.render(this.player.x, this.player.y, this.player.orientation * PI_OVER_TWO);
        this.gameLoop();
    }

    render(posX = this.player.x, posY = this.player.y, angle = this.player.angle) {
        if (!this.rendering.renderer) {
            console.log("Renderer not ready yet");
            return;
        }
        this.rendering.renderer.renderFrame(
            posX + 0.5, // add .5 to get camera into center of cell
            posY + 0.5, // add .5 to get camera into center of cell
            angle,
        );
    }

    loadMap() {
        const mapString = document.getElementById("mapText").value;

        this.map = TileMap.fromText(mapString);

        this.player._posV = this.map.findFirst({ startLocation: true });
        if (!this.player._posV) {
            throw new Error("Could not find a start location for the player");
        }
        console.log(this.map.getAreaAround(this.player.x, this.player.y, 5).toString());

        const minimapElement = document.getElementById("minimap");
        const minimapWindow = new AsciiWindow(minimapElement, 9, 9); // MAGIC NUMBERS: width and height of the minimap
        this.minimap = new MiniMapRenderer(minimapWindow, this.map);

        const textureUrls = [eobWallUrl1, eobWallUrl2];
        const textureCount = textureUrls.length;
        const textures = [];

        textureUrls.forEach((url) => {
            Texture.fromSource(url).then((texture) => {
                textures.push(texture);

                if (textures.length < textureCount) {
                    return;
                }

                this.rendering.renderer = new FirstPersonRenderer(
                    this.rendering.view,
                    this.map,
                    this.rendering.fov,
                    this.rendering.maxDepth,
                    textures,
                );
                this.render();
                this.minimap.draw(this.player.x, this.player.y, this.player.orientation);

                console.debug("renderer ready", texture);
            });
        });
    }

    startTurnAnimation(quarterTurns = 1) {
        if (this.isAnimating) {
            throw new Error("Cannot start an animation while one is already running");
        }

        if (quarterTurns === 0) {
            return;
        }

        this.animation = {
            startAngle: this.player.angle,
            startTime: performance.now(),
            startX: this.player.x,
            startY: this.player.y,

            targetAngle: this.player.angle + PI_OVER_TWO * quarterTurns,
            targetTime: performance.now() + 700, // MAGIC NUMBER: these animations take .7 seconds
            targetX: this.player.x,
            targetY: this.player.y,
        };

        //
        this.player._directionV.rotateCCW(quarterTurns);
        this.updateCompass();
    }

    /** @type {RelativeMovement} Direction the player is going to move */
    startMoveAnimation(direction) {
        //
        if (this.isAnimating) {
            throw new Error("Cannot start an animation while one is already running");
        }

        //
        // When we move, we move relative to our current viewing direction,
        // so moving LEFT means moving 1 square 90 degrees from our viewing direction vector
        const targetV = this.player._directionV.rotatedCCW(direction | 0).added(this.player._posV);

        //
        // We cant move into walls
        if (this.map.isWall(targetV.x, targetV.y)) {
            this.debounce = (this.pollsPerSec / 5) | 0;
            console.info(
                "bumped into wall at %s (mypos: %s), direction=%d",
                targetV,
                this.player._posV,
                this.player.angle,
            );
            return;
        }

        this.animation = {
            startAngle: this.player.angle,
            startTime: performance.now(),
            startX: this.player.x,
            startY: this.player.y,

            targetAngle: this.player.angle,
            targetTime: performance.now() + 700, // MAGIC NUMBER: these animations take .7 seconds
            targetX: targetV.x,
            targetY: targetV.y,
        };
        this.player._posV = targetV;

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
            ArrowLeft: () => this.startTurnAnimation(-1),
            ArrowRight: () => this.startTurnAnimation(1),
            KeyQ: () => this.startTurnAnimation(-1),
            KeyE: () => this.startTurnAnimation(1),
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
        //
        // Guard: only animate if called for
        if (!this.isAnimating) {
            this.animation = {};
            return;
        }

        //
        // Guard, stop animation if it took too long
        if (this.animation.targetTime <= performance.now()) {
            this.render(this.player.x, this.player.y, this.player.angle);
            this.animation = {};
            this.minimap.draw(this.player.x, this.player.y, this.player.orientation);
            return;
        }

        const a = this.animation;

        const nowT = performance.now();
        const animY = a.targetY - a.startY; // how much this animation causes us to move in the y-direction
        const animX = a.targetX - a.startX; // how much this animation causes us to move in the x-direction
        const animA = a.targetAngle - a.startAngle; // how much this animation causes us to rotate in total
        const animT = a.targetTime - a.startTime; // how long (in ms) this animation is supposed to take.

        const deltaT = (nowT - a.startTime) / animT;
        if (deltaT > 1) {
            throw new Error("Not supposed to happen!");
        }

        // render
        this.render(
            a.startX + animX * deltaT, //
            a.startY + animY * deltaT, //
            a.startAngle + animA * deltaT, //
        );
    }

    gameLoop() {
        //
        // We're not animating, so we chill out for 50 msec
        if (!this.isAnimating) {
            setTimeout(() => this.gameLoop(), 50); // MAGIC NUMBER
            return;
        }

        this.handleAnimation();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateCompass() {
        //
        //
        // Update the compass
        document.getElementById("compass").textContent = sprintf(
            "%s %s (%d --> %.2f [%dº])",
            this.player._posV,
            Object.keys(Orientation)[this.player.orientation].toLowerCase(),
            this.player.orientation,
            this.player.orientation * PI_OVER_TWO,
            this.player.orientation * 90,
        );
    }
}

// Start the game
window.game = new DungeonCrawler();
