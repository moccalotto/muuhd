import { NRGBA } from "./ascii_textureloader.js";
import { TileMap, Tile } from "./ascii_tile_map.js";
import { AsciiWindow } from "./ascii_window.js";

/**
 * Which side of a tile did the ray strike
 */
export const Side = {
    X_AXIS: 0,
    Y_AXIS: 1,
};
class RayCollision {
    mapX = 0;
    mapY = 0;
    rayLength = 0;
    side = Side.X_AXIS;
    /** @type {Tile} */
    tile;
}

class RayCastResult {
    hitWall = false;
    hitSprite = false;
    wallCollision = new RayCollision();

    /** @type {RayCollision[]} */
    collisions = [];
}

/**
 * @typedef {object} FirstPersonRendererOptions
 * @property {string} wallChar
 * @property {NRGBA} floorColor
 * @property {string} floorChar
 * @property {NRGBA} ceilingColor
 * @property {string} ceilingChar
 * @property {number} viewDistance
 * @property {number} fov
 */

/**
 * @type {FirstPersonRendererOptions}
 */
export const DefaultRendererOptions = {
    wallChar: "W",
    floorColor: new NRGBA(0.365, 0.165, 0.065),
    floorChar: "f",
    ceilingColor: new NRGBA(0.3, 0.3, 0.3),
    ceilingChar: "c",
    fadeOutColor: new NRGBA(0.3, 0.3, 0.3),
    viewDistance: 5,
    fov: Math.PI / 3, // 60 degrees - good for spooky
};

export class FirstPersonRenderer {
    /**
     * @param {AsciiWindow} aWindow the window we render onto.
     * @param {TileMap} map
     * @param {Texture[]} textures
     * @param {FirstPersonRendererOptions} options
     */
    constructor(aWindow, map, textures, options) {
        /** @constant @readonly @type {TileMap} */
        this.map = map;

        /** @constant @readonly @type {AsciiWindow} */
        this.window = aWindow;

        /** @constant @readonly @type {number} */
        this.fov = options.fov ?? DefaultRendererOptions.fov;

        /** @constant @readonly @type {number} */
        this.viewDistance = options.viewDistance ?? DefaultRendererOptions.viewDistance;

        /** @constant @readonly @type {Texture[]} */
        this.textures = textures;

        /** @constant @readonly @type {string} */
        this.wallChar = options.wallChar ?? DefaultRendererOptions.wallChar;
        /** @constant @readonly @type {NRGBA} */
        this.floorColor = options.floorColor ?? DefaultRendererOptions.floorColor;
        /** @constant @readonly @type {string} */
        this.floorChar = options.floorChar ?? DefaultRendererOptions.floorChar;
        /** @constant @readonly @type {NRGBA} */
        this.ceilingColor = options.ceilingColor ?? DefaultRendererOptions.ceilingColor;
        /** @constant @readonly @type {string} */
        this.ceilingChar = options.ceilingChar ?? DefaultRendererOptions.ceilingChar;

        /**
         * Pre-computed colors to use when drawing floors, ceilings and "fadeout"
         *
         * There is one entry for every screen row.
         * Each entry contains a color to  use when drawing floors, ceilings, and "fadeout".
         *
         * @constant @readonly @type {Array<Array<string>>}
         */
        this.shades = [];

        /**
         * Pre-compute the shades variable
         */
        this.computeShades();
    }

    computeShades() {
        const screenHeight = this.window.height;
        const halfScreenHeight = screenHeight / 2;
        const lineHeight = Math.floor(screenHeight / this.viewDistance);
        const minY = Math.floor(-lineHeight / 2 + halfScreenHeight); // if y lower than minY, then we're painting ceiling
        const maxY = Math.floor(lineHeight / 2 + halfScreenHeight); // if y higher than maxY then we're painting floor

        for (let y = 0; y < screenHeight; y++) {
            if (y < minY) {
                //
                // y is smaller than minY. This means we're painting above
                // the walls, i.e. painting the ceiling.
                // The closer y is to minY, the farther away this part of the
                // ceiling is.
                //
                // High diff => near
                // Low diff => far
                //
                const diff = minY - y;
                this.shades.push([this.ceilingChar, this.ceilingColor.mulledRGB(diff / minY).toCSS()]);
            } else if (y >= maxY) {
                //
                // Floor
                //
                const diff = y - maxY;
                this.shades.push([this.floorChar, this.floorColor.mulledRGB(diff / minY).toCSS()]);
            } else {
                //
                // The darkness at the end of the tunnel
                //
                this.shades.push([" ", "#000"]);
            }
        }
    }

    renderFrame(posX, posY, dirAngle, commit = true) {
        const benchmarkStart = performance.now();
        const screenWidth = this.window.width;

        /** @type {Map<number,Tile} The coordinates of all the tiles checked while rendering this frame*/
        const coordsCheckedFrame = new Map();

        for (let x = 0; x < screenWidth; x++) {
            /** @type {Map<number,Tile} The coordinates of all the tiles checked while casting this single ray*/
            const coordsCheckedRay = new Map();

            const angleOffset = (x / screenWidth - 0.5) * this.fov; // in radians
            const rayAngle = dirAngle + angleOffset;
            const rayDirX = Math.cos(rayAngle);
            const rayDirY = Math.sin(rayAngle);

            // Cast ray using our DDA function
            const ray = this.castRay(posX, posY, rayDirX, rayDirY, coordsCheckedRay);

            coordsCheckedRay.forEach((tile, idx) => {
                coordsCheckedFrame.set(idx, tile);
            });

            //
            // Render a single screen column
            this.renderColumn(x, ray, rayDirX, rayDirY, angleOffset);
        }

        const renderTime = performance.now() - benchmarkStart;

        // Did it take more than 5ms to render the scene?
        if (renderTime > 5) {
            console.log("Rendering took a long time", { renderTime });
        }

        if (commit) {
            requestAnimationFrame(() => {
                const benchmarkStart = performance.now();
                this.window.commitToDOM();
                const commitTime = performance.now() - benchmarkStart;
                if (commitTime > 5) {
                    console.log("Updating DOM took a long time:", { commitTime });
                }
            });
        }
    }

    /**
     * Render a column on the screen where the ray hit a wall.
     * @param {number} x
     * @param {RayCastResult} ray
     * @param {number} rayDirX
     * @param {number} rayDirY
     * @param {number} angleOffset for far (in radians) is this column from the middle of the screen
     *
     * @protected
     */
    renderColumn(x, ray, rayDirX, rayDirY, angleOffset) {
        //
        // Check if we hit anything at all
        if (ray.collisions.length === 0) {
            //
            // We didn't hit anything. Just paint floor, wall, and darkness
            for (let y = 0; y < this.window.height; y++) {
                const [char, color] = this.shades[y];
                this.window.put(x, y, char, color);
            }
            return;
        }

        const { rayLength, side, sampleU, tile: wallTile } = ray.collisions[0];

        const distance = Math.max(rayLength * Math.cos(angleOffset), 1e-12); // Avoid divide by zero

        //
        // Calculate perspective.
        //
        const screenHeight = this.window.height;
        const lineHeight = Math.round(screenHeight / distance); // using round() because floor() gives aberrations when distance == (n + 0.500)
        const halfScreenHeight = screenHeight / 2;
        const halfLineHeight = lineHeight / 2;

        let minY = Math.floor(halfScreenHeight - halfLineHeight);
        let maxY = Math.floor(halfScreenHeight + halfLineHeight);
        let unsafeMinY = minY; // can be lower than zero - it happens when we get so close to a wall we cannot see top or bottom

        if (minY < 0) {
            minY = 0;
        }
        if (maxY >= screenHeight) {
            maxY = screenHeight - 1;
        }

        //
        // Pick texture (here grid value decides which texture)
        //
        const wallTexture = this.textures[wallTile.textureId];

        for (let y = 0; y < screenHeight; y++) {
            //
            // Are we hitting the ceiling?
            //
            if (y < minY || y > maxY) {
                const [char, color] = this.shades[y];
                this.window.put(x, y, char, color);
                continue;
            }
            if (y === minY) {
                this.window.put(x, y, "m", "#0F0");
                continue;
            }
            if (y === maxY) {
                this.window.put(x, y, "M", "#F00");
                continue;
            }

            //
            // Map screen y to texture y
            let sampleV = (y - unsafeMinY) / lineHeight; // y- coordinate of the texture point to sample

            const color = wallTexture.sample(sampleU, sampleV);

            //
            // North-south walls are shaded differently from east-west walls
            let shade = side === Side.X_AXIS ? 0.8 : 1.0; // MAGIC NUMBERS

            //
            // Dim walls that are far away
            const lightLevel = 1 - rayLength / this.viewDistance;

            //
            // Darken the image
            color.mulRGB(shade * lightLevel);

            this.window.put(x, y, this.wallChar, color.toCSS());
        }
    }

    /**
     * @param {number} camX x-coordinate of the camera (is the same
     * @param {number} camY y-coordinate of the camera
     * @param {number} dirX x-coordinate of the normalized vector of the viewing direction of the camera.
     * @param {number} dirX y-coordinate of the normalized vector of the viewing direction of the camera.
     * @param {Set<number>} coodsChecked
     *
     * @returns {RayCastResult}
     *
     */
    castRay(camX, camY, dirX, dirY, coordsChecked) {
        // Current map square
        let mapX = Math.floor(camX);
        let mapY = Math.floor(camY);

        // Length of ray from one x or y-side to next x or y-side
        const deltaDistX = dirX === 0 ? 1e15 : Math.abs(1 / dirX);
        const deltaDistY = dirY === 0 ? 1e15 : Math.abs(1 / dirY);

        // Step direction (+1 or -1) and initial sideDist[XY]
        let stepX; //           When DDA takes a horizontal step (on the map), how far should it move?
        let stepY; //           When DDA takes a vertical step (on the map), how far should it move?
        let sideDistX; //       How far has the ray moved horizontally (on the map) ?
        let sideDistY; //       How far has the ray moved vertically  (on the map) ?
        let side = Side.X_AXIS;

        //
        // Calculate how to move along the x-axis
        if (dirX < 0) {
            stepX = -1; //                                      step left along the x-axis
            sideDistX = (camX - mapX) * deltaDistX; //          we've moved from the camera to the left edge of the tile
        } else {
            stepX = 1; //                                       step right along the x-axis
            sideDistX = (mapX + 1.0 - camX) * deltaDistX; //    we've moved from the camera to the right edge of the tile
        }

        //
        // Calculate how to move along the y-axis
        if (dirY < 0) {
            stepY = -1; //                              //      step down along the y-axis
            sideDistY = (camY - mapY) * deltaDistY; //          we've move from the camera to the bottom edge of the tile
        } else {
            stepY = 1; //                                   //  step up along the y-axis
            sideDistY = (mapY + 1.0 - camY) * deltaDistY; //    we've moved from the camera to the top edge of the tile
        }

        /**
         * Any sprites the ray has hit on its way.
         * They are ordered in reverse order of closeness to the camera,
         * so that if they are drawn in their array ordering, they will
         * appear in the correct order on the screen.
         *
         * @type {RayCastResult}
         */
        const result = new RayCastResult();

        // DDA loop
        while (!result.hitWall) {
            //
            // Check if ray is longer than viewDistance
            if (Math.min(sideDistX, sideDistY) > this.viewDistance) {
                return result;
            }

            //
            // Check for out of bounds
            if (mapX < 0 || mapX >= this.map.width || mapY < 0 || mapY >= this.map.height) {
                return result;
            }

            let wallDist, sampleU;

            //
            // Should we step in the x- or y-direction
            // DDA dictates we always move along the shortest vector
            if (sideDistX < sideDistY) {
                //
                // Move horizontally
                //
                sideDistX += deltaDistX;
                mapX += stepX;
                side = Side.X_AXIS;
                // Ray hit the east or west edge of the wall-tile
                wallDist = (mapX - camX + (1 - stepX) / 2) / dirX;
                sampleU = (camY + wallDist * dirY) % 1;

                if (dirX > 0) {
                    sampleU = 1 - sampleU;
                }
            } else {
                //
                // Move vertically
                //
                sideDistY += deltaDistY;
                mapY += stepY;
                side = Side.Y_AXIS;
                // Ray hit the north or south edge of the wall-tile
                wallDist = (mapY - camY + (1 - stepY) / 2) / dirY;
                sampleU = (camX + wallDist * dirX) % 1;
                if (dirY < 0) {
                    sampleU = 1 - sampleU;
                }
            }

            const tile = this.map.get(mapX, mapY);
            coordsChecked.set(this.map.tileIdx(mapX, mapY), tile);

            const rayLength = Math.hypot(
                wallDist * dirX, //
                wallDist * dirY, //
            );

            //
            // --------------------------
            // Add a Sprite to the result
            // --------------------------
            if (tile.sprite || tile.wall) {
                //
                // Prepend the element to the array so rear-most sprites
                // appear first in the array,
                // enabling us to simply draw from back to front
                const collision = new RayCollision();
                result.collisions.unshift(collision);

                collision.mapX = mapX;
                collision.mapY = mapY;
                collision.rayLength = rayLength;
                collision.tile = tile;
                collision.sampleU = sampleU;
                collision.side = side;
                if (result.sprite) {
                    collision.sprite = true;
                }
                if (result.wall) {
                    collision.wall = true;
                    return;
                }
            }

            //
            // --------------------------
            // Add a Wall to the result
            //  (and return)
            // --------------------------
            if (tile.wall) {
                result.hitWall = true;

                // <todo>
                // DELETE BELOW
                result.wallCollision.tile = tile;
                result.wallCollision.side = side;

                result.wallCollision.mapX = mapX;
                result.wallCollision.mapY = mapY;
                result.wallCollision.rayLength = rayLength;
                result.wallCollision.sampleU = sampleU;
                // </todo>
                return result;
            }
        }
    }
}

if (Math.PI < 0 && AsciiWindow && TileMap && Tile) {
    ("STFU Linda");
}
