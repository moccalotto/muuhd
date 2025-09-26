import { TileMap } from "./ascii_tile_map.js";
import { AsciiWindow } from "./ascii_window.js";

export const Side = {
    X_AXIS: 0,
    Y_AXIS: 1,
};

export class FirstPersonRenderer {
    /**
     * @param {AsciiWindow} aWindow the window we render onto.
     * @param {TileMap} map
     * @param {number} fov field of view (in radians)
     * @param {number} maxDist maximum view distance.
     * @param {TexturePack} textures
     */
    constructor(aWindow, map, fov, maxDist, textures) {
        /** @constant @readonly @type {TileMap} */
        this.map = map;

        /** @constant @readonly @type {AsciiWindow} */
        this.window = aWindow;

        /** @constant @readonly @type {number} */
        this.fov = fov;

        /** @constant @readonly @type {number} */
        this.maxDist = maxDist;

        /** @constant @readonly @type {Texture[]} */
        this.textures = textures;
    }

    renderFrame(posX, posY, dirAngle, commit = true) {
        const screenWidth = this.window.width;

        for (let x = 0; x < screenWidth; x++) {
            const angleOffset = (x / screenWidth - 0.5) * this.fov; // in radians
            const rayAngle = dirAngle + angleOffset;
            const rayDirX = Math.cos(rayAngle);
            const rayDirY = Math.sin(rayAngle);

            // Cast ray using our DDA function
            const hit = this.castRay(posX, posY, rayDirX, rayDirY, rayAngle);

            //
            // Did we hit something?
            //
            if (!hit) {
                // we did not hit anything. Either the ray went out of bounds,
                // or it went too far, so move on to next pseudo-pixel
                this.renderNoHitCol(x);
                continue;
            }

            //
            // Our ray hit a wall, render it.
            this.renderHitCol(x, hit, rayDirX, rayDirY, angleOffset);
        }

        if (commit) {
            this.window.commitToDOM();
        }
    }

    /**
     * Render a vertical column of pixels on the screen at the x coordinate.
     * This occurs when the ray did not hit anything.
     *
     * @protected
     */
    renderNoHitCol(x) {
        const screenHeight = this.window.height;
        const halfScreenHieght = screenHeight / 2;
        const lineHeight = Math.floor(screenHeight / this.maxDist);
        let minY = Math.floor(-lineHeight / 2 + halfScreenHieght);
        let maxY = Math.floor(lineHeight / 2 + halfScreenHieght);

        for (let y = 0; y < screenHeight; y++) {
            if (y < minY) {
                this.window.put(x, y, "c", "#333"); // ceiling
            } else if (y > maxY) {
                this.window.put(x, y, "f", "#b52"); // floor
            } else {
                const char = ["·", "÷", "'", "~"][(y + x) % 4];
                this.window.put(x, y, char, "#222"); // the far distance
            }
        }
    }

    /**
     * Render a column on the screen where the ray hit a wall.
     * @protected
     */
    renderHitCol(x, hit, rayDirX, rayDirY, angleOffset) {
        const { rayLength, side, textureOffsetX, mapX, mapY } = hit;

        const tile = this.map.get(mapX, mapY);
        const safeDistance = Math.max(rayLength * Math.cos(angleOffset), 1e-9); // Avoid divide by zero

        //
        // Calculate perspective.
        //
        const screenHeight = this.window.height;
        const halfScreenHieght = screenHeight / 2;
        const lineHeight = Math.floor(screenHeight / safeDistance);
        let minY = Math.floor(-lineHeight / 2 + halfScreenHieght);
        let maxY = Math.floor(lineHeight / 2 + halfScreenHieght);
        let unsafeMinY = minY; // can be lower than zero

        if (minY < 0) {
            minY = 0;
        }
        if (maxY >= screenHeight) {
            maxY = screenHeight - 1;
        }

        // Pick texture (here grid value decides which texture)
        const texture = this.textures[tile.textureId % this.textures.length];

        // X coord on texture
        let sampleU = textureOffsetX;

        if (side === 0 && rayDirX > 0) {
            sampleU = 1 - sampleU;
        }
        if (side === 1 && rayDirY < 0) {
            sampleU = 1 - sampleU;
        }

        for (let y = 0; y < screenHeight; y++) {
            //
            // Are we hitting the ceiling?
            //
            if (y < minY) {
                this.window.put(x, y, "c", "#333");
                continue;
            }

            if (y > maxY) {
                this.window.put(x, y, "f", "#b52");
                continue;
            }

            //
            // Map screen y to texture y
            let sampleV = (y - unsafeMinY) / lineHeight; // y- coordinate of the texture point to sample

            const color = texture.sample(sampleU, sampleV);

            //
            // North-south walls are shaded differently from east-west walls
            let shade = side === Side.X_AXIS ? 0.7 : 1.0; // MAGIC NUMBERS

            //
            // Dim walls that are far away
            shade = shade / (1 + rayLength * 0.1);

            //
            // Darken the image
            color.mulRGB(shade);

            // const distancePalette = ["█", "▓", "▒", "░", " "];
            const distancePalette = ["#", "#", "#", "%", "+", "÷", " ", " "];
            const char = distancePalette[rayLength | 0];

            this.window.put(x, y, char, color.toCSS());
        }
    }

    /**
     * @param {number} camX x-coordinate of the camera (is the same
     * @param {number} camY y-coordinate of the camera
     * @parma {number} dirX x-coordinate of the normalized vector of the viewing direction of the camera.
     * @parma {number} dirX y-coordinate of the normalized vector of the viewing direction of the camera.
     */
    castRay(camX, camY, dirX, dirY) {
        // Current map square
        let mapX = Math.floor(camX);
        let mapY = Math.floor(camY);

        if (dirX === 0 || dirY === 0) {
            console.log("Divide by zero is incoming", { dirX, dirY });
        }

        Number.MAX_SAFE_INTEGER;
        // Length of ray from one x or y-side to next x or y-side
        const deltaDistX = dirX === 0 ? 1e15 : Math.abs(1 / dirX);
        const deltaDistY = dirY === 0 ? 1e15 : Math.abs(1 / dirY);

        // Step direction (+1 or -1) and initial sideDist[XY]
        let stepX; //           When DDA takes a horizontal step (on the map), how far should it move?
        let stepY; //           When DDA takes a vertical step (on the map), how far should it move?
        let sideDistX; //       How far has the ray moved horizontally (on the map) ?
        let sideDistY; //       How far has the ray moved vertically  (on the map) ?

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

        //
        // Did the ray hit a wall ?
        //
        let hit = false;

        //
        // Did the ray hit a wall on a horizontal edge or a vertical edge?
        //
        let side = Side.X_AXIS;

        // DDA loop
        while (!hit) {
            //
            // Check if ray is longer than maxDist
            if (Math.min(sideDistX, sideDistY) > this.maxDist) {
                return false; // ray got too long, no hit, exit early
            }

            //
            // Check for out of bounds
            if (mapX < 0 || mapX >= this.map.width || mapY < 0 || mapY >= this.map.height) {
                return false; // ray got outside the map, no hit, exit early
            }

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
            } else {
                //
                // Move vertically
                //
                sideDistY += deltaDistY;
                mapY += stepY;
                side = Side.Y_AXIS;
            }

            //
            // Check if ray hit a wall
            if (this.map.isWall(mapX, mapY)) {
                //
                // Ray hit a wall, proceed to the rest of the algorithm.
                //
                hit = true;
            }
        }

        //
        // The distance to the wall, measured perpendicularly to the viewing angle
        // The perpendicular distance is used to avoid the fish-eye distortion
        // that would occur if we measured the Euclidean distance from the camera
        // to the where the ray impacted the wall. This makes sense when you realize
        // that, when looking directly at a wall, the shortest rays would be right in
        // front of the camera, making it seem as if the wall bowed outwards toward
        // the camera.
        //
        let perpWallDist;

        //
        // Where did we hit the wall. Measured as a normalized x-coordinate only;
        //
        let textureOffsetX;

        //
        // Determine both the perpendicular distance to the wall
        // and the x-coordinate (on the wall) where the ray hit it.
        //
        if (side === Side.X_AXIS) {
            //
            // Ray hit the left or right edge of the wall-tile
            //
            perpWallDist = (mapX - camX + (1 - stepX) / 2) / dirX;
            textureOffsetX = camY + perpWallDist * dirY;
        } else {
            //
            // Ray hit the upper or lower edge of the wall-tile
            //
            perpWallDist = (mapY - camY + (1 - stepY) / 2) / dirY;
            textureOffsetX = camX + perpWallDist * dirX;
        }

        //
        // Normalize textureOffsetX. We only want the fractional part.
        //
        textureOffsetX -= Math.floor(textureOffsetX);

        const rayLength = Math.hypot(
            perpWallDist * dirX, //
            perpWallDist * dirY, //
        );

        return {
            mapX,
            mapY,
            side,
            rayLength,
            textureOffsetX,
        };
    }
}

if (Math.PI < 0 && AsciiWindow && TileMap) {
    ("STFU Linda");
}
