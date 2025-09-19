import { sprintf } from "sprintf-js";
import { Xorshift32 } from "../utils/random.js";
import { WfcGrid } from "./WfcGrid.js";
import { SourceCell } from "./SourceCell.js";
import { SourceGrid } from "./SourceGrid.js";

class PainterApp {
    /** @type {number} The index of the color we're currently painting with */
    toolPaletteIndex = 0;

    /** @type {string} Mode. Draw or fill */
    mode = "draw";
    /** @type {boolean} */
    isDrawing = false;

    /**@param {string[]} pal */
    constructor(dim, pal, gridElement, paletteElement, previewElement) {
        /** @type {number} */
        this.dim = dim;
        /** @type {string[]} Default color palette */
        this.palette = pal;
        /** @type {HTMLElement} */
        this.gridElement = gridElement;
        /** @type {HTMLElement} */
        this.previewElement = previewElement;
        /** @type {HTMLElement} */
        this.paletteElement = paletteElement;

        this.reset();
    }

    reset() {
        // Assume the "background" color is always the last color in the palette.
        const fillWith = 0;
        this.sourceGrid = new SourceGrid(
            Array(this.dim ** 2)
                .fill(null)
                .map(() => new SourceCell(new Uint8Array(9).fill(fillWith))),
        );

        this.createGridHtmlElements();
        this.createPaletteSwatch();
        this.updatePreview();
        this.setToolPaletteIndex(1);
        this.updateSourceGrid();
    }

    createGridHtmlElements() {
        this.gridElement.innerHTML = "";

        for (let i = 0; i < this.dim ** 2; i++) {
            const pixel = document.createElement("div");
            pixel.className = `pal-idx-${this.getCell(i)}`;
            pixel.setAttribute("id", "cell-idx-" + i);

            pixel.addEventListener("mousedown", (e) => this.mouseDown(e, i));

            this.gridElement.appendChild(pixel);
        }

        // Prevent context menu and handle mouse events
        this.gridElement.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    createPaletteSwatch() {
        this.paletteElement.innerHTML = "";

        this.palette.forEach((color, paletteIndex) => {
            const swatch = document.createElement("div");
            swatch.classList.add("color-swatch");
            swatch.classList.add(`pal-idx-${paletteIndex}`);
            swatch.style.backgroundColor = color;
            swatch.onclick = () => this.setToolPaletteIndex(paletteIndex);
            this.paletteElement.appendChild(swatch);
        });
    }

    setToolPaletteIndex(paletteIndex) {
        //
        this.toolPaletteIndex = paletteIndex;

        const colorSwatches = this.paletteElement.querySelectorAll(".color-swatch");
        colorSwatches.forEach((swatch) => {
            const isActive = swatch.classList.contains(`pal-idx-${paletteIndex}`);
            swatch.classList.toggle("active", isActive);
        });
    }

    setTool(tool) {
        this.mode = tool;
        document.querySelectorAll(".tools button").forEach((btn) => btn.classList.remove("active"));
        document.getElementById(tool + "Btn").classList.add("active");

        const status = document.getElementById("status");
        switch (tool) {
            case "draw":
                status.textContent = "Drawing mode - Click to paint pixels";
                break;
            case "fill":
                status.textContent = "Fill mode - Click to fill area";
                break;
        }
    }

    mouseDown(e, index) {
        e.preventDefault();
        this.applyTool(index);
    }

    getCell(idx, y = undefined) {
        if (y === undefined) {
            return this.sourceGrid.cells[idx].value;
        }

        // Treat idx as an x-coordinate, and calculate an index
        return this.sourceGrid.cells[y * this.dim + idx].value;
    }

    applyTool(index) {
        switch (this.mode) {
            case "draw":
                this.setPixel(index, this.toolPaletteIndex);
                break;
            case "fill":
                this.floodFill(index, this.toolPaletteIndex);
                break;
        }
    }

    setPixel(cellIdx, palIdx) {
        const pixEl = document.getElementById("cell-idx-" + cellIdx);
        this.sourceGrid.cells[cellIdx].value = palIdx;
        pixEl.className = "pal-idx-" + palIdx;
        this.updateSourceCell(cellIdx);
        this.updatePreview();
    }

    floodFill(startIndex, fillColorPalIdx) {
        const targetPalIdx = this.getCell(startIndex);

        if (targetPalIdx === fillColorPalIdx) {
            return;
        }

        const stack = [startIndex];
        const visited = new Set();

        while (stack.length > 0) {
            const index = stack.pop();

            if (visited.has(index) || this.getCell(index) !== targetPalIdx) continue;

            visited.add(index);
            this.setPixel(index, fillColorPalIdx);

            // Add neighbors
            const row = Math.floor(index / this.dim);
            const col = index % this.dim;

            if (row > 0) stack.push(index - this.dim); // up
            if (row < 8) stack.push(index + this.dim); // down
            if (col > 0) stack.push(index - 1); // left
            if (col < 8) stack.push(index + 1); // right
        }
    }

    randomFill() {
        for (let i = 0; i < this.dim ** 2; i++) {
            this.setPixel(i, Math.floor(Math.random() * this.palette.length));
        }
    }

    invertColors() {
        for (let i = 0; i < this.dim ** 2; i++) {
            const cell = this.getCell(i);

            const inverted = cell % 2 === 0 ? cell + 1 : cell - 1;

            this.setPixel(i, inverted);
        }
        this.setToolPaletteIndex(
            this.toolPaletteIndex % 2 === 0 ? this.toolPaletteIndex + 1 : this.toolPaletteIndex - 1,
        );
    }

    updatePreview() {
        const canvas = document.createElement("canvas");
        canvas.width = this.dim;
        canvas.height = this.dim;
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < this.dim ** 2; i++) {
            const x = i % this.dim;
            const y = Math.floor(i / this.dim);
            ctx.fillStyle = this.palette[this.getCell(i)];
            ctx.fillRect(x, y, 1, 1);
        }
        this.previewElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
        this.previewElement.style.backgroundSize = "100%";
        return;
    }

    updateSourceGrid() {
        for (let i = 0; i < this.dim ** 2; i++) {
            this.updateSourceCell(i);
        }
    }

    /** @param {number} i */
    updateSourceCell(idx) {
        const dim = this.dim;
        const x = idx % dim;
        const y = Math.floor(idx / dim);

        const valueAt = (dX, dY) => {
            const _x = (x + dim + dX) % dim; // add dim before modulo because JS modulo allows negative results
            const _y = (y + dim + dY) % dim;
            return this.getCell(_y * dim + _x);
        };

        this.sourceGrid.cells[idx].values = new Uint8Array([
            //                      | neighbour
            // ---------------------|-----------
            valueAt(-1, -1), //     | northwest
            valueAt(0, -1), //      | north
            valueAt(1, -1), //      | northeast

            valueAt(-1, 0), //      | east
            this.getCell(idx), //   | -- self --
            valueAt(1, 0), //       | west

            valueAt(-1, 1), //      | southwest
            valueAt(0, 1), //       | south
            valueAt(1, 1), //       | southeast
        ]);
    }

    exportAsImage() {
        const canvas = document.createElement("canvas");
        canvas.width = this.dim;
        canvas.height = this.dim;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        for (let i = 0; i < this.dim ** 2; i++) {
            const x = i % this.dim;
            const y = Math.floor(i / this.dim);
            ctx.fillStyle = this.palette[this.getCell(i)];
            ctx.fillRect(x, y, 1, 1);
        }

        const link = document.createElement("a");
        link.download = `pixel-art-${this.dim}x${this.dim}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    exportAsData() {
        const data = Array.from({ length: this.dim ** 2 }, (_, i) => this.getCell(i));
        const blob = new Blob([data], { type: "application/json" });
        const link = document.createElement("a");
        link.download = "pixel-art-data.json";
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    importData() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (!Array.isArray(data) && data.length === this.dim ** 2) {
                            alert("Invalid data format!");
                        }
                        data.forEach((v, k) => {
                            this.setPixel(k, v);
                        });
                        this.createGridHtmlElements();
                        this.updatePreview();
                        this.updateSourceGrid();
                    } catch (error) {
                        alert("Error reading file!" + error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    waveFunction() {
        this.updateSourceGrid();
        const wfcImg = new WfcGrid(
            // this.previewElement.clientWidth,
            // this.previewElement.clientHeight,
            10,
            10,
            this.sourceGrid.clone(),
            new Xorshift32(Date.now()),
        );

        // Could not "collapse" the image.
        // We should reset and try again?
        let running = true;
        let count = 0;
        const maxCount = 1000;

        const collapseFunc = () => {
            running = wfcImg.collapse();

            const canvas = document.createElement("canvas");
            canvas.width = wfcImg.width;
            canvas.height = wfcImg.height;

            const ctx = canvas.getContext("2d");
            let i = 0;
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const cell = wfcImg.cells[i++];
                    ctx.fillStyle = cell.value;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            this.previewElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
            this.previewElement.style.backgroundSize = "100%";

            if (running && ++count < maxCount) {
                setTimeout(collapseFunc, 1);
            }
        };
        collapseFunc();
    }
}
const base_palette = [
    "#FFF",
    "#007",
    "#00F",
    "#070",
    "#077",
    "#0F0",
    "#0FF",
    "#0f0",
    "#700",
    "#707",
    "#770",
    "#F00",
    "#F0F",
    "#FF0",
];

const palette = new Array();

base_palette.forEach((color) => {
    //
    // Calc inverted color
    const invR = 15 - Number.parseInt(color.substr(1, 1), 16);
    const invG = 15 - Number.parseInt(color.substr(2, 1), 16);
    const invB = 15 - Number.parseInt(color.substr(3, 1), 16);
    const invColor = sprintf("#%x%x%x", invR, invG, invB);

    // populate the palette
    palette.push(color);
    palette.push(invColor);
});

window.painter = new PainterApp(
    9,
    palette,
    document.getElementById("gridContainer"), //
    document.getElementById("colorPalette"), //
    document.getElementById("preview"), //
);

//   ____ ____ ____
//  / ___/ ___/ ___|
// | |   \___ \___ \
// | |___ ___) |__) |
//  \____|____/____/
//--------------------

//
// share the dimensions of the SourceGrid with CSS/HTML
document.getElementsByTagName("body")[0].style.setProperty("--dim", window.painter.dim);

//
// --------------------------------------
// Add the palette colors as CSS classes
// --------------------------------------

const styleElement = document.createElement("style");
styleElement.type = "text/css";

let cssRules = "";
palette.forEach((color, index) => {
    const className = `pal-idx-${index}`;
    cssRules += `.${className} { background-color: ${color} !important; }\n`;
});

// Add the CSS to the style element
styleElement.innerHTML = cssRules;

// Append to head
document.head.appendChild(styleElement);
