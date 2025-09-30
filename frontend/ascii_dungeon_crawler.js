import { Vector2i, Orientation, RelativeMovement, PI_OVER_TWO } from "./ascii_types.js";
import { DefaultRendererOptions, FirstPersonRenderer } from "./ascii_first_person_renderer.js";
import { MiniMapRenderer } from "../ascii_minimap_renderer.js";
import { AsciiWindow } from "./ascii_window.js";
import { TileMap } from "./ascii_tile_map.js";
import eobWallUrl1 from "./eob1.png";
import gnollSpriteUrl from "./gnoll.png";
import { sprintf } from "sprintf-js";

class Player {
    /** @protected */
    _posV = new Vector2i();

    /** @protected */
    _directionV = new Vector2i(0, 1);

    /** @type {number} number of milliseconds to sleep before next gameLoop.  */
    delay = 0;

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
            /** @type {FirstPersonRenderer} */ firstPersonRenderer: null,
            /** @type {MiniMapRenderer}     */ miniMapRenderer: null,

            firstPersonWindow: new AsciiWindow(document.getElementById("viewport"), 100, 45), // MAGIC CONSTANTS
            minimapWindow: new AsciiWindow(document.getElementById("minimap"), 9, 9), // MAGIC CONSTANT

            options: DefaultRendererOptions,
        };

        /** @readonly @type {MiniMapRenderer} */
        this.player = new Player();

        this.setupControls();
        this.loadMap();

        //
        // Start the game loop
        //
        this.gameLoop();
    }

    /**
     * Render a first person view of the camera in a given position and orientation.
     *
     * @param {number} camX the x-coordinate of the camera (in map coordinates)
     * @param {number} camY the y-coordinate of the camera (in map coordinates)
     * @param {number} angle the orientation of the camera in radians around the unit circle.
     */
    render(camX = this.player.x, camY = this.player.y, angle = this.player.angle) {
        if (!this.rendering.firstPersonRenderer) {
            console.log("Renderer not ready yet");
            return;
        }
        this.rendering.firstPersonRenderer.renderFrame(
            camX, // add .5 to get camera into center of cell
            camY, // add .5 to get camera into center of cell
            angle,
        );
    }

    renderMinimap() {
        this.rendering.miniMapRenderer.draw(this.player.x, this.player.y, this.player.orientation);
    }

    loadMap() {
        const mapString = document.getElementById("mapText").value;

        this.map = TileMap.fromText(mapString);

        this.player._posV = this.map.findFirst({ isStartLocation: true });

        if (!this.player._posV) {
            throw new Error("Could not find a start location for the player");
        }

        this.rendering.miniMapRenderer = new MiniMapRenderer(this.rendering.minimapWindow, this.map);

        const textureFilenames = [eobWallUrl1, gnollSpriteUrl];
        this.rendering.firstPersonRenderer = new FirstPersonRenderer(
            this.rendering.firstPersonWindow,
            this.map,
            textureFilenames,
            this.rendering.options,
        );
        this.rendering.firstPersonRenderer.onReady = () => {
            this.render();
            this.renderMinimap();
            this.renderCompass();
        };
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
            console.info(
                "bumped into wall at %s (mypos: %s), direction=%d",
                targetV,
                this.player._posV,
                this.player.angle,
            );
            // this.delay += 250; // MAGIC NUMBER: Pause for a tenth of a second after hitting a wall
            // return false;
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

        return true;
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
            ArrowLeft: () => this.startTurnAnimation(1),
            ArrowRight: () => this.startTurnAnimation(-1),
            KeyQ: () => this.startTurnAnimation(1),
            KeyE: () => this.startTurnAnimation(-1),
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
    }

    handleKeyboardInput() {
        //
        // Check each key we can handle.
        for (let key of this.keys.names) {
            if (this.keys.pressed[key]) {
                const keyHandler = this.keys.handlers[key];
                return keyHandler();
            }
        }
        return false;
    }

    /**
     * @returns {boolean} true if an animation is in progress
     */
    handleAnimation() {
        //
        // Guard: only animate if called for
        if (!this.isAnimating) {
            this.animation = {};
            return false;
        }

        //
        // Guard: stop animation if it took too long
        if (this.animation.targetTime <= performance.now()) {
            this.render(this.player.x, this.player.y, this.player.angle);
            this.renderMinimap();
            this.renderCompass();
            this.animation = {};
            return false;
        }

        const a = this.animation;

        const nowT = performance.now();
        const animY = a.targetY - a.startY; // how much this animation causes us to move in the y-direction
        const animX = a.targetX - a.startX; // how much this animation causes us to move in the x-direction
        const animA = a.targetAngle - a.startAngle; // how much this animation causes us to rotate in total
        const animT = a.targetTime - a.startTime; // how long (in ms) this animation is supposed to take.
        const progress = Math.min((nowT - a.startTime) / animT, 1);

        // render
        this.render(
            a.startX + animX * progress, //
            a.startY + animY * progress, //
            a.startAngle + animA * progress, //
        );

        return true;
    }

    gameLoop() {
        //
        // Has something in the game logic told us to chill out?
        //
        if (this.delay) {
            setTimeout(() => this.gameLoop(), this.delay);
            this.delay = 0;
            return;
        }

        //
        // Are we animating ?
        // Then render a single frame, and then chill out for 20ms.
        // Do not process keyboard input while animating
        //
        if (this.handleAnimation()) {
            setTimeout(() => this.gameLoop(), 20);
            return;
        }

        //
        // Has a key been pressed that we need to react to?
        // Then queue up a new gameLoop call to be executed
        // as soon as possible.
        //
        // NOTE: this happens inside a microtask to ensure
        // that the call stack does not get too big and that
        // each single call to gameLoop does not take too
        // long
        //
        if (this.handleKeyboardInput()) {
            queueMicrotask(() => this.gameLoop());
            return;
        }

        //
        // Are we idling?
        // Then only check for new events every 20ms to use less power
        //
        setTimeout(() => this.gameLoop(), 50); // MAGIC NUMBER
    }

    renderCompass() {
        //
        //
        // Update the compass
        document.getElementById("compass").innerHTML = sprintf(
            "<div>%s</div><div>%s</div>",
            this.player._posV,
            Object.keys(Orientation)[this.player.orientation].toLowerCase(),
        );
    }
}

// Start the game
window.game = new DungeonCrawler();
