class PaintProg {
    /** @type {string} */
    currentColor = "#000";
    /** @type {string} */
    currentTool = "draw";
    /** @type {boolean} */
    isDrawing = false;
    /** @type {boolean} */
    drawingMode = false;

    /**@param {string[]} pal */
    constructor(dim, pal, gridElement, paletteElement, currentColorElement, colorPickerElement, previewElement) {
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
        /** @type {HTMLElement} */
        this.currentColorElement = currentColorElement;
        /** @type {HTMLInputElement} */
        this.colorPickerElement = colorPickerElement;

        this.subImages = Array.from({ length: this.samplePixels.length }, () => [...this.samplePixels]);

        this.createGrid();
        this.createColorPalette();
        this.updatePreview();
        this.setCurrentColor(pal[0]);
        this.updateAllSubimages();
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

        this.palette.forEach((color) => {
            const swatch = document.createElement("div");
            swatch.className = "color-swatch";
            swatch.style.backgroundColor = color;
            swatch.onclick = () => this.setCurrentColor(color);
            this.paletteElement.appendChild(swatch);
        });
    }

    setCurrentColor(color) {
        this.currentColor = color;
        this.currentColorElement.style.backgroundColor = color;
        this.colorPickerElement.value = color;

        // Update active swatch
        // NOTE: this was "document.querySelectorAll "
        this.paletteElement.querySelectorAll(".color-swatch").forEach((swatch) => {
            swatch.classList.toggle("active", swatch.style.backgroundColor === this.colorToRgb(color));
        });
    }

    colorToRgb(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return `rgb(${r}, ${g}, ${b})`;
    }

    openColorPicker() {
        this.colorPickerElement.click();
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

        this.updateSingleSubImage(index);
        this.updatePreview(index);
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    applyTool(index) {
        switch (this.currentTool) {
            case "draw":
                this.setPixel(index, this.currentColor);
                break;
            case "fill":
                this.floodFill(index, this.samplePixels[index], this.currentColor);
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
                ctx.fillStyle = this.subImages[subImageIdx][i];
                ctx.fillRect(x, y, 1, 1);
            }
        }

        this.previewElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
        this.previewElement.style.backgroundSize = "100%";
    }

    updateAllSubimages() {
        for (let i = 0; i < this.samplePixels.length; i++) {
            this.updateSingleSubImage(i);
        }
    }

    updateSingleSubImage(i) {
        const dim = this.dim;
        const len = dim ** 2;
        const x = i % dim;
        const y = Math.floor(i / dim);

        const colorAt = (dX, dY) => {
            const _x = (x + dim + dX) % dim; // add dim before modulo because JS modulo allows negative results
            const _y = (y + dim + dY) % dim;
            if (y == 0 && dY < 0) {
                console.log(_x, _y);
            }
            return this.samplePixels[_y * dim + _x];
        };

        this.subImages[i] = [
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
        ];
    }

    exportAsImage() {
        const canvas = document.createElement("canvas");
        canvas.width = 90; // 9x upscale
        canvas.height = 90;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        for (let i = 0; i < this.dim ** 2; i++) {
            const x = (i % this.dim) * 10;
            const y = Math.floor(i / this.dim) * 10;
            ctx.fillStyle = this.samplePixels[i];
            ctx.fillRect(x, y, 10, 10);
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
                        alert("Error reading file!");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Initialize the editor
}
const palette = [
    "#000",
    "#008",
    "#00f",
    "#080",
    "#088",
    "#0f0",
    "#0ff",
    "#800",
    "#808",
    "#80f",
    "#880",
    "#888",
    "#88f",
    "#8f8",
    "#8ff",
    "#ccc",
    "#f00",
    "#f0f",
    "#f80",
    "#f88",
    "#f8f",
    "#ff0",
    "#ff8",
    "#fff",
];

window.painter = new PaintProg(
    9,
    palette,
    document.getElementById("gridContainer"), //
    document.getElementById("colorPalette"), //
    document.getElementById("currentColor"), //
    document.getElementById("colorPicker"), //
    document.getElementById("preview"), //
);

// share window.dim with the HTML and CSS
document.getElementsByTagName("body")[0].style.setProperty("--dim", window.painter.dim);
