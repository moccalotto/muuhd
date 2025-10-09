import { TileMap } from "./ascii_tile_map.js";
import { Orientation, Vector2i } from "./ascii_types.js";
import { AsciiWindow } from "./ascii_window.js";

export class MiniMap {
    /**
     * @param {AsciiWindowInterface} aWindow
     * @param {TileMap} map
     */
    constructor(aWindow, map) {
        if (aWindow.width !== aWindow.height) {
            console.warn("Window now square", { width: aWindow.width, height: aWindow.height });
            throw new Error("Window must be square");
        }
        if (aWindow.width % 2 === 0) {
            console.warn("Window width must not be an even number", {
                width: aWindow.width,
            });
            throw new Error("Window dimension is even, it must be uneven");
        }

        /** @type {AsciiWindow} */
        this.window = aWindow;

        /** @type {TileMap} */
        this.map = map;

        /** @type {number} how far we can see on the minimap */
        this.distance = (aWindow.width - 1) / 2;
    }

    /**
     * @param {number} pX
     * @param {number} pY
     * @param {Orientation}  orientation
     */
    draw(pX, pY, orientation) {
        //
        // 2D array of tiles that are visible
        const visibleTiles = new Array(this.map.height).fill().map(() => new Array(this.map.width).fill(false));

        const radius = this.distance;
        const radiusSq = radius * radius;

        //
        // Mark a tile visible
        const setVisible = (x, y) => {
            if (x < 0) return;
            if (y < 0) return;
            if (x >= visibleTiles[0].length) return;
            if (y >= visibleTiles.length) return;

            visibleTiles[y][x] = true;
        };

        //
        // Test if a tile is visible
        const isVisible = (x, y) => {
            if (x < 0) return false;
            if (y < 0) return false;
            if (x >= visibleTiles[0].length) return false;
            if (y >= visibleTiles.length) return false;

            return visibleTiles[y][x];
        };

        //
        // Recursive shadowcasting
        const castLight = (row, startSlope, endSlope, xx, xy, yx, yy) => {
            //
            if (startSlope < endSlope) {
                return;
            }

            for (let i = row; i <= radius; i++) {
                let dx = -i;
                const dy = -i;
                let blocked = false;
                let newStart = startSlope;

                while (dx <= 0) {
                    const X = pX + dx * xx + dy * xy;
                    const Y = pY + dx * yx + dy * yy;

                    const lSlope = (dx - 0.5) / (dy + 0.5);
                    const rSlope = (dx + 0.5) / (dy - 0.5);

                    if (startSlope < rSlope) {
                        dx++;
                        continue;
                    }
                    if (endSlope > lSlope) {
                        break;
                    }

                    if (dx * dx + dy * dy <= radiusSq) {
                        setVisible(X, Y);
                    }

                    if (blocked) {
                        if (this.map.looksLikeWall(X, Y)) {
                            newStart = rSlope;
                        } else {
                            blocked = false;
                            startSlope = newStart;
                        }
                    } else if (i < radius && this.map.looksLikeWall(X, Y)) {
                        blocked = true;
                        castLight(i + 1, startSlope, lSlope, xx, xy, yx, yy);
                        newStart = rSlope;
                    }
                    dx++;
                }

                if (blocked) {
                    break;
                }
            }
        };

        const computeVisibleTiles = () => {
            setVisible(pX, pY);

            const multipliers = [
                [1, 0, 0, 1], //        Octant 1 (N-NE)
                [0, 1, 1, 0], //        Octant 2 (E-NE)
                [-1, 0, 0, 1], //       Octant 3 (N-NW)
                [0, 1, -1, 0], //       Octant 4 (W-NW)
                [-1, 0, 0, -1], //      Octant 5 (S-SW)
                [0, -1, -1, 0], //      Octant 6 (W-SW)
                [1, 0, 0, -1], //       Octant 7 (S-SE)
                [0, -1, 1, 0], //       Octant 8 (E-SE)
            ];

            for (const m of multipliers) {
                castLight(1, 1.0, 0.0, ...m);
            }
        };

        computeVisibleTiles();

        let [invertX, invertY, switchXY] = [false, false, false];

        switch (orientation) {
            case Orientation.NORTH:
                invertX = true;
                break;
            case Orientation.SOUTH:
                invertY = true;
                break;
            case Orientation.EAST:
                invertY = true;
                invertX = true;
                switchXY = true;
                break;
            case Orientation.WEST:
                switchXY = true;
                break;
        }

        let [x, y] = [0, 0];
        const max = this.window.width - 1;
        const dX = invertX ? -1 : 1;
        const dY = invertY ? -1 : 1;
        const startX = invertX ? max : 0;
        const startY = invertY ? max : 0;

        const minX = pX - radius;
        const minY = pY - radius;
        const maxX = pX + radius;
        const maxY = pY + radius;

        //
        y = startY;
        for (let mapY = minY; mapY <= maxY; mapY++) {
            //
            x = startX;
            for (let mapX = minX; mapX <= maxX; mapX++) {
                //
                const [putX, putY] = switchXY ? [y, x] : [x, y];

                if (isVisible(mapX, mapY)) {
                    const tile = this.map.get(mapX, mapY);
                    this.window.put(putX, putY, tile.minimapChar, tile.minimapColor);
                } else {
                    // this.window.put(putX, putY, "░", "#666");
                    this.window.put(putX, putY, "█", "#222");
                }
                x += dX;
            }
            y += dY;
        }
        this.window.put(this.distance, this.distance, "@", "#4f4fff");
        this.window.commitToDOM();
    }
}

if (Math.PI < 0 && AsciiWindow && TileMap && Vector2i) {
    ("STFU Linda");
}
