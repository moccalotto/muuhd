import { NRGBA, Texture } from "./ascii_textureloader";
import { TileMap } from "./ascii_tile_map";
import { AsciiWindow } from "./ascii_window";

export class FirstPersonRenderer2 {
    constructor(aWindow, map, wallTex, floorTex, ceilTex) {
        if (!(aWindow instanceof AsciiWindow)) {
            throw new Error("Invalid type for aWindow");
        }
        if (!(map instanceof TileMap)) {
            throw new Error("Invalid type for map");
        }
        if (!(wallTex instanceof Texture && floorTex instanceof Texture && ceilTex instanceof Texture)) {
            throw new Error("Invalid type for texture");
        }

        /** @type {AsciiWindow} */
        this.window = aWindow;

        /** @type {TileMap} */
        this.map = map;

        /** @type {Texture} */
        this.wallTextures = wallTex;
        /** @type {Texture} */
        this.floorTexture = floorTex;
        /** @type {Texture} */
        this.ceilTexture = ceilTex;

        /** @type {number} */
        this.fov = Math.PI / 3; // 60 degrees
        /** @type {number} */
        this.viewDist = 5.0;
        /** @type {NRGBA} */
        this.fadeOutColor = new NRGBA(0.03, 0.03, 0.03);
    }

    renderFrame(map, px, py, pAngle, floorCtx, ceilCtx, wallCtx) {
        const setPixel = (x, y, color, char = "#") => {
            this.window.put(x, y, char, color);
        };

        const mapW = this.map.width;
        const mapH = this.map.height;
        const screenW = this.window.width;
        const screenH = this.window.height;
        const halfH = screenH / 2;
        const nearZero = 1e-9;

        const fov = this.fov;
        const viewDist = this.viewDist;
        const fadeOutColor = this.fadeOutColor;

        //
        // Texture image data and dimensions
        //
        const floorTex = floorCtx.canvas;
        const ceilTex = ceilCtx.canvas;
        const wallTex = wallCtx.canvas;
        const floorImg = floorCtx.getImageData(0, 0, floorTex.width, floorTex.height).data;
        const ceilImg = ceilCtx.getImageData(0, 0, ceilTex.width, ceilTex.height).data;
        const wallImg = wallCtx.getImageData(0, 0, wallTex.width, wallTex.height).data;

        //
        // For each screen column, cast a ray
        //
        for (let x = 0; x < screenW; x++) {
            //
            // compute ray angle by linear interpolation across FOV (angle-based)
            //
            //       The Chad Method
            //       const cameraX = (2 * x) / screenW - 1; // -1 .. 1
            //       const rayAngle = pAngle + Math.atan(cameraX * Math.tan(fov / 2)); // approximate steer by angle
            //
            //
            // The Claude method - pretty sure it ONLY works when fov is 60º
            const rayAngle = pAngle - fov / 2 + (x / screenW) * fov;

            //
            // Direction vector for rayAngle
            //
            const dirX = Math.cos(rayAngle);
            const dirY = Math.sin(rayAngle);

            //
            // DDA init
            //
            let mapX = Math.floor(px);
            let mapY = Math.floor(py);
            let stepX;
            let stepY;
            let sideDistX;
            let sideDistY;
            const deltaDistX = Math.abs(1 / (dirX === 0 ? nearZero : dirX));
            const deltaDistY = Math.abs(1 / (dirY === 0 ? nearZero : dirY));

            //
            // Calculate how far to step for each cell of progress with the DDA algorithm
            // This depends on which quadrant of the coordinate system the ray is traversing
            //
            if (dirX < 0) {
                stepX = -1;
                sideDistX = (px - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - px) * deltaDistX;
            }
            if (dirY < 0) {
                stepY = -1;
                sideDistY = (py - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - py) * deltaDistY;
            }

            // DDA loop
            let hit = false;
            let side = 0;
            let rayLen = 0; // The length of the ray in steps (t-units), not map coordinate units.
            let steps = 0;
            const maxSteps = Math.ceil(viewDist * Math.max(deltaDistX, deltaDistY)) + Math.max(mapW, mapH); // safe cap

            while (steps++ < maxSteps) {
                //
                // Do the DDA thing
                // Lengthen the ray in one step that takes it
                // to the next tile border in either the x- or y-
                // direction, depending on which distance
                // is shorter.
                //
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                    rayLen = sideDistX - deltaDistX;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                    rayLen = sideDistY - deltaDistY;
                }

                //
                // Stop if outside map
                //
                if (mapX < 0 || mapX >= mapW || mapY < 0 || mapY >= mapH) {
                    break;
                }

                //
                // Check map to see if there's a wall
                //
                if (map[mapY][mapX]) {
                    hit = true;
                    break;
                }

                //
                // If View Distance exceeded, break
                //
                if (steps++ >= maxSteps) {
                    break;
                }

                // // Chad's method for checking if view dist exceeded. Precision at the cost of computation
                // const possibleWorldDist = rayLen * Math.sqrt(dirX * dirX + dirY * dirY); // rayLen already in "t" units, dir is unit-length so this is rayLen
                // if (possibleWorldDist > viewDist) {
                //     break;
                // }
            }

            //
            // compute actual distance along ray (rayLen is the t along ray to grid boundary where hit occurred)
            // If didn't hit or exceeded distance => paint near-black full column
            //
            if (!hit) {
                for (let y = 0; y < screenH; y++) {
                    setPixel(x, y, fadeOutColor);
                }
                continue;
            }

            // ray length along ray to hit point
            const adjustedRayLength = rayLen; // since dir is unit vector (cos,sin), rayLen matches distance along ray

            if (adjustedRayLength > viewDist) {
                for (let y = 0; y < screenH; y++) setPixel(x, y, fadeOutColor);
                continue;
            }

            // Fish-eye correction: perpendicular distance to camera plane
            const perpDist = Math.max(
                adjustedRayLength * Math.cos(rayAngle - pAngle),
                nearZero, // Avoid dividing by zero
            );

            // vertical wall slice height
            const lineHeight = Math.floor(screenH / perpDist);
            const halfLineHeight = lineHeight / 2;

            // compute draw start and end
            let drawStart = Math.floor(-halfLineHeight + halfH);
            let drawEnd = Math.floor(halfLineHeight + halfH);
            if (drawStart < 0) drawStart = 0;
            if (drawEnd >= screenH) drawEnd = screenH - 1;

            // exact hit point coordinates
            const hitX = px + dirX * adjustedRayLength;
            const hitY = py + dirY * adjustedRayLength;

            // texture X coordinate (fractional part of the hit point along the wall)
            let wallX;
            if (side === 0) wallX = hitY - Math.floor(hitY);
            else wallX = hitX - Math.floor(hitX);
            if (wallX < 0) wallX += 1;
            const texW = wallTex.width,
                texH = wallTex.height;
            let texX = Math.floor(wallX * texW);
            if ((side === 0 && dirX > 0) || (side === 1 && dirY < 0)) {
                // flip texture horizontally for some sides for nicer-looking mapping (optional)
                texX = texW - texX - 1;
            }

            // draw wall vertical slice by sampling wall texture per-screen-pixel
            for (let y = drawStart; y <= drawEnd; y++) {
                const d = y - halfH + halfLineHeight; // position on texture
                const texY = Math.floor((d * texH) / lineHeight);
                const srcI = (Math.max(0, Math.min(texY, texH - 1)) * texW + Math.max(0, Math.min(texX, texW - 1))) * 4;
                const color = [wallImg[srcI], wallImg[srcI + 1], wallImg[srcI + 2], wallImg[srcI + 3]];
                setPixel(x, y, color);
            }

            //
            // --- Floor & ceiling texturing (per-column), using Lodev method ---
            //
            // Points on the wall where the floor/ceiling start (the exact hit point)
            const floorWallX = hitX;
            const floorWallY = hitY;
            // distance from camera to wall (we'll use perpDist for weight)
            const distWall = perpDist;

            // for each y row below the wall (floor)
            for (let y = drawEnd + 1; y < screenH; y++) {
                // current distance from the player to the row (rowDistance)
                // formula based on projection geometry (Lodev): rowDistance = screenH / (2*y - screenH)
                const rowDistance = screenH / (2.0 * y - screenH);

                // weight for interpolation between player pos and floor wall hit
                const weight = rowDistance / distWall;

                // sample real world position (floorX, floorY) that corresponds to this pixel
                const curFloorX = weight * floorWallX + (1.0 - weight) * px;
                const curFloorY = weight * floorWallY + (1.0 - weight) * py;

                // texture coordinates (wrap/repeat)
                const fx = curFloorX - Math.floor(curFloorX);
                const fy = curFloorY - Math.floor(curFloorY);
                const tx = Math.floor(fx * floorTex.width) % floorTex.width;
                const ty = Math.floor(fy * floorTex.height) % floorTex.height;
                const floorI = (ty * floorTex.width + tx) * 4;
                const ceilI = (ty * ceilTex.width + tx) * 4;

                // floor pixel
                setPixel(x, y, [floorImg[floorI], floorImg[floorI + 1], floorImg[floorI + 2], floorImg[floorI + 3]]);
                // ceiling symmetric pixel
                const cy = screenH - y - 1;
                if (cy >= 0 && cy < screenH) {
                    setPixel(x, cy, [ceilImg[ceilI], ceilImg[ceilI + 1], ceilImg[ceilI + 2], ceilImg[ceilI + 3]]);
                }
            }

            // Optional: draw ceiling above drawStart if there is any gap (the loop above writes symmetric ceiling).
            for (let y = 0; y < drawStart; y++) {
                // already partially filled by symmetric ceil writes; fill any remaining with ceiling texture via interpolation
                // compute rowDistance for this y (same formula, but now y is in upper half)
                const rowDistance = screenH / (2.0 * y - screenH);
                const weight = rowDistance / distWall;
                const curFloorX = weight * floorWallX + (1.0 - weight) * px;
                const curFloorY = weight * floorWallY + (1.0 - weight) * py;
                const fx = curFloorX - Math.floor(curFloorX);
                const fy = curFloorY - Math.floor(curFloorY);
                const tx = Math.floor(fx * ceilTex.width) % ceilTex.width;
                const ty = Math.floor(fy * ceilTex.height) % ceilTex.height;
                const ceilI = (ty * ceilTex.width + tx) * 4;
                setPixel(x, y, [ceilImg[ceilI], ceilImg[ceilI + 1], ceilImg[ceilI + 2], ceilImg[ceilI + 3]]);
            }
        } // end columns loop
    }
}
