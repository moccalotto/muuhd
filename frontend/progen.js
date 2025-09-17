import { sprintf } from "sprintf-js";
import { Xorshift32 } from "../utils/random.js";
import { WfcGrid } from "./WfcGrid.js";
import { TrainingCell } from "./TrainingCell.js";
import { TrainingGrid } from "./TrainingGrid.js";

class PainApp {
    /** @type {string} */
    activeColor = "#000";
    /** @type {string} */
    currentTool = "draw";
    /** @type {boolean} */
    isDrawing = false;
    /** @type {boolean} */
    drawingMode = false;

    /**@param {string[]} pal */
    constructor(dim, pal, gridElement, paletteElement, previewElement) {
        /** @type {number} */
        this.dim = dim;
        /** @type {string[]} Default color palette */
        this.palette = pal;
        /** @type {string[]} */
        this.samplePixels = new Array(dim ** 2).fill(pal[pal.length - 1]);
        /** @type {HTMLElement} */
        this.gridElement = gridElement;
        /** @type {HTMLElement} */
        this.previewElement = previewElement;
        /** @type {HTMLElement} */
        this.paletteElement = paletteElement;
        /** @type {HTMLInputElement} */

        this.trainingImage = new TrainingGrid(
            this.samplePixels.map(() => {
                return new TrainingCell();
            }),
        );

        this.createGrid();
        this.createColorPalette();
        this.updatePreview();
        this.setActiveColor(pal[0]);
        this.updateTrainingGrid();
    }

    createGrid() {
        this.gridElement.innerHTML = "";

        for (let i = 0; i < this.dim ** 2; i++) {
            const pixel = document.createElement("div");
            pixel.className = "pixel";
            pixel.setAttribute("data-index", i);
            pixel.style.backgroundColor = this.samplePixels[i];

            pixel.addEventListener("mousedown", (e) => this.startDrawing(e, i));
            pixel.addEventListener("mouseenter", (e) => this.continueDrawing(e, i));
            pixel.addEventListener("mouseup", () => this.stopDrawing());

            this.gridElement.appendChild(pixel);
        }

        // Prevent context menu and handle mouse events
        this.gridElement.addEventListener("contextmenu", (e) => e.preventDefault());
        document.addEventListener("mouseup", () => this.stopDrawing());
    }

    createColorPalette() {
        this.paletteElement.innerHTML = "";

        this.palette.forEach((color, paletteIndex) => {
            const swatch = document.createElement("div");
            swatch.classList.add("color-swatch");
            swatch.classList.add(`pal-idx-${paletteIndex}`);
            swatch.classList.add(`pal-color-${color}`);
            swatch.style.backgroundColor = color;
            swatch.onclick = () => this.setActiveColor(paletteIndex);
            this.paletteElement.appendChild(swatch);
        });
    }

    setActiveColor(paletteIndex) {
        //
        this.activeColor = this.palette[paletteIndex];

        const colorSwatches = this.paletteElement.querySelectorAll(".color-swatch");
        colorSwatches.forEach((swatch) => {
            const isActive = swatch.classList.contains(`pal-idx-${paletteIndex}`);
            swatch.classList.toggle("active", isActive);
        });
    }

    setTool(tool) {
        this.currentTool = tool;
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

    toggleDrawingMode() {
        this.drawingMode = !this.drawingMode;
        const btn = document.getElementById("drawModeBtn");
        if (this.drawingMode) {
            btn.textContent = "Drawing Mode: ON";
            btn.classList.add("drawing-mode");
            document.getElementById("status").textContent = "Drawing mode ON - Click and drag to paint";
        } else {
            btn.textContent = "Drawing Mode: OFF";
            btn.classList.remove("drawing-mode");
            document.getElementById("status").textContent = "Drawing mode OFF - Click individual pixels";
        }
    }

    startDrawing(e, index) {
        e.preventDefault();
        this.isDrawing = true;
        this.applyTool(index);
    }

    /** @param {MouseEvent} e */
    continueDrawing(e, index) {
        if (this.isDrawing && this.drawingMode) {
            this.applyTool(index);
            return;
        }

        this.updateTrainingCell(index);
        this.updatePreview(index);
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    applyTool(index) {
        switch (this.currentTool) {
            case "draw":
                this.setPixel(index, this.activeColor);
                break;
            case "fill":
                this.floodFill(index, this.samplePixels[index], this.activeColor);
                break;
        }
    }

    setPixel(index, color) {
        this.samplePixels[index] = color;
        const pixel = document.querySelector(`[data-index="${index}"]`);
        pixel.style.backgroundColor = color;
        this.updatePreview();
    }

    floodFill(startIndex, targetColor, fillColor) {
        if (targetColor === fillColor) return;

        const stack = [startIndex];
        const visited = new Set();

        while (stack.length > 0) {
            const index = stack.pop();
            if (visited.has(index) || this.samplePixels[index] !== targetColor) continue;

            visited.add(index);
            this.setPixel(index, fillColor);

            // Add neighbors
            const row = Math.floor(index / this.dim);
            const col = index % this.dim;

            if (row > 0) stack.push(index - this.dim); // up
            if (row < 8) stack.push(index + this.dim); // down
            if (col > 0) stack.push(index - 1); // left
            if (col < 8) stack.push(index + 1); // right
        }
    }

    clearCanvas() {
        this.samplePixels.fill("#fff");
        this.createGrid();
        this.updatePreview();
    }

    randomFill() {
        for (let i = 0; i < this.dim ** 2; i++) {
            const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
            this.setPixel(i, randomColor);
        }
    }

    invertColors() {
        for (let i = 0; i < this.dim ** 2; i++) {
            const color = this.samplePixels[i];
            const r = 15 - parseInt(color.substr(1, 1), 16);
            const g = 15 - parseInt(color.substr(2, 1), 16);
            const b = 15 - parseInt(color.substr(3, 1), 16);
            const inverted =
                "#" +
                r.toString(16) + // red
                g.toString(16) + // green
                b.toString(16); // blue

            this.setPixel(i, inverted);

            if (i % 10 === 0) {
                console.log("invertion", {
                    color,
                    r,
                    g,
                    b,
                    inverted,
                });
            }
        }
    }

    updatePreview(subImageIdx = undefined) {
        const canvas = document.createElement("canvas");
        if (subImageIdx === undefined) {
            canvas.width = this.dim;
            canvas.height = this.dim;
            const ctx = canvas.getContext("2d");

            for (let i = 0; i < this.dim ** 2; i++) {
                const x = i % this.dim;
                const y = Math.floor(i / this.dim);
                ctx.fillStyle = this.samplePixels[i];
                ctx.fillRect(x, y, 1, 1);
            }
        } else {
            canvas.width = 3;
            canvas.height = 3;
            const ctx = canvas.getContext("2d");

            for (let i = 0; i < 3 * 3; i++) {
                //
                const x = i % 3;
                const y = Math.floor(i / 3);
                ctx.fillStyle = this.trainingImage.pixels[subImageIdx].subPixels[i];
                ctx.fillRect(x, y, 1, 1);
            }
        }

        this.previewElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
        this.previewElement.style.backgroundSize = "100%";
    }

    updateTrainingGrid() {
        for (let i = 0; i < this.samplePixels.length; i++) {
            this.updateTrainingCell(i);
        }
    }

    updateTrainingCell(i) {
        const dim = this.dim;
        const x = i % dim;
        const y = Math.floor(i / dim);

        const colorAt = (dX, dY) => {
            const _x = (x + dim + dX) % dim; // add dim before modulo because JS modulo allows negative results
            const _y = (y + dim + dY) % dim;
            return this.samplePixels[_y * dim + _x];
        };

        this.trainingImage.pixels[i] = new TrainingCell([
            //                      | neighbour
            // ---------------------|-----------
            colorAt(-1, -1), //     | northwest
            colorAt(0, -1), //      | north
            colorAt(1, -1), //      | northeast

            colorAt(-1, 0), //      | east
            this.samplePixels[i], //| -- self --
            colorAt(1, 0), //       | west

            colorAt(-1, 1), //      | southwest
            colorAt(0, 1), //       | south
            colorAt(1, 1), //       | southeast
        ]);
    }

    exportAsImage() {
        const canvas = document.createElement("canvas");
        canvas.width = this.dim; // 9x upscale
        canvas.height = this.dim;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        for (let i = 0; i < this.dim ** 2; i++) {
            const x = i % this.dim;
            const y = Math.floor(i / this.dim);
            ctx.fillStyle = this.samplePixels[i];
            ctx.fillRect(x, y, 1, 1);
        }

        const link = document.createElement("a");
        link.download = `pixel-art-${this.dim}x${this.dim}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    exportAsData() {
        const data = JSON.stringify(this.samplePixels);
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
                        if (Array.isArray(data) && data.length === this.dim ** 2) {
                            this.samplePixels = data;
                            this.createGrid();
                            this.updatePreview();
                        } else {
                            alert("Invalid data format!");
                        }
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
        this.updateTrainingGrid();
        const wfcImg = new WfcGrid(
            // this.previewElement.clientWidth,
            // this.previewElement.clientHeight,
            30,
            30,
            this.trainingImage.clone(),
            new Xorshift32(Date.now()),
        );

        // Could not "collapse" the image.
        // We should reset and try again?
        let its = wfcImg.collapse();

        if (its > 0) {
            throw new Error(`Function Collapse failed with ${its} iterations left to go`);
        }

        const canvas = document.createElement("canvas");
        canvas.width = wfcImg.width;
        canvas.height = wfcImg.height;

        // debug values
        canvas.width = 30;
        canvas.height = 30;
        //
        const ctx = canvas.getContext("2d");
        let i = 0;
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                console.log("pix");
                const cell = wfcImg.cells[i++];
                if (cell.valid) {
                    ctx.fillStyle = "magenta";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        this.previewElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
        this.previewElement.style.backgroundSize = "100%";
    }
}
const base_palette = [
    "#000",
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

const palette = new Array(base_palette.length * 2);

base_palette.forEach((color, idx) => {
    //
    // Calc inverted color
    const invR = 15 - Number.parseInt(color.substr(1, 1), 16);
    const invG = 15 - Number.parseInt(color.substr(2, 1), 16);
    const invB = 15 - Number.parseInt(color.substr(3, 1), 16);
    const invColor = sprintf("#%x%x%x", invR, invG, invB);

    // populate the palette
    palette[idx] = color;
    palette[7 * 4 - 1 - idx] = invColor;
});

window.painter = new PainApp(
    9,
    palette,
    document.getElementById("gridContainer"), //
    document.getElementById("colorPalette"), //
    document.getElementById("preview"), //
);

// share window.dim with the HTML and CSS
document.getElementsByTagName("body")[0].style.setProperty("--dim", window.painter.dim);
