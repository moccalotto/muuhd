import { TileMap } from "./frontend/ascii_tile_map.js";
import { Vector2i } from "./frontend/ascii_types.js";
import { AsciiWindow } from "./frontend/ascii_window.js";

export class MiniMapRenderer {
	/**
	 * @param {AsciiWindow} aWindow
	 * @param {TileMap} map
	 */
	constructor(aWindow, map) {
		if (aWindow.width !== aWindow.height) {
			console.log("Window now square", { width: aWindow.width, height: aWindow.height });
			throw new Error("Window must be square");
		}
		if (aWindow.width % 2 === 0) {
			console.log("Window dimension must be uneven", { width: aWindow.width, height: aWindow.height });
			throw new Error("Window dimension is even, it must be uneven");
		}

		/** @type {AsciiWindow} */
		this.window = aWindow;

		/** @type {TileMap} */
		this.map = map;

		/** @type {number} how far we can see on the minimap */
		this.distance = (aWindow.width - 1) / 2;

		this.fg = undefined; // Let the CSS of the parent element control the colors of the tiles
		this.bg = undefined; // let the CSS of the parent element control the background colors of the tiles
	}

	/**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Orientation}  orientation
	 */
	draw(centerX, centerY, orientation) {
		// these variables are the coordinates of the
		// area of the map (not minimap) we are looking at
		const minX = centerX - this.distance;
		const maxX = centerX + this.distance;
		const minY = centerY - this.distance;
		const maxY = centerY + this.distance;

		const distanceV = new Vector2i(this.distance, this.distance);

		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				const wndPosV = new Vector2i(x - centerX, y - centerY).rotateCW(orientation + 1).add(distanceV);

				this.window.put(wndPosV.x, wndPosV.y, this.map.get(x, y).minimap, this.fg, this.bg);
			}
		}
		this.window.put(this.distance, this.distance, "@", "#44F");
		this.window.commitToDOM();
	}
}

if (Math.PI < 0 && AsciiWindow && TileMap && Vector2i) {
	("STFU Linda");
}
