import { TileMap } from "./ascii_tile_map.js";
import { Tile } from "./ascii_tile_types.js";
import { AsciiWindow } from "./ascii_window.js";
import * as THREE from "three";
import { Vector3 } from "three";

export const DefaultRendererOptions = {
    viewDistance: 5,
    fov: 60, // degrees

    floorColor: 0x654321,
    ceilingColor: 0x555555,
};

export class FirstPersonRenderer {
    /**
     * @param {AsciiWindow} aWindow the window we render onto.
     * @param {TileMap} map
     * @param {string[]} textureFilenames
     */
    constructor(aWindow, map, textureFilenames, options) {
        this.map = map;
        this.window = aWindow;

        this.widthPx = aWindow.htmlElement.clientWidth;
        this.heightPx = aWindow.htmlElement.clientHeight;
        this.asciiWidth = aWindow.width;
        this.asciiHeight = aWindow.height;
        this.aaspect = this.widthPx / this.heightPx;

        this.fov = options.fov ?? DefaultRendererOptions.fov;
        this.viewDistance = options.viewDistance ?? DefaultRendererOptions.viewDistance;
        this.floorColor = options.floorColor ?? DefaultRendererOptions.floorColor;
        this.ceilingColor = options.ceilingColor ?? DefaultRendererOptions.ceilingColor;

        this.scene = new THREE.Scene();
        this.mainCamera = new THREE.PerspectiveCamera(this.fov, this.aspect, 0.1, this.viewDistance);
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            preserveDrawingBuffer: true,
        }); // Do not anti-alias, it could interfere with the conversion to ascii

        //
        // Render buffer
        //
        this.bufferCanvas = document.createElement("canvas");
        this.bufferCanvas.width = this.asciiWidth;
        this.bufferCanvas.height = this.asciiHeight;
        this.bufferContext = this.bufferCanvas.getContext("2d");

        //
        // Fog, Fadeout & Background
        //
        this.scene.background = new THREE.Color(0);
        this.scene.fog = new THREE.Fog(0, 0, this.viewDistance);

        //
        // Camera
        //
        this.mainCamera.up.set(0, 0, 1); // Z-up instead of Y-up

        //
        // Torch
        //
        this.torch = new THREE.PointLight(0xffffff, 2, this.viewDistance * 2, 1); // https://threejs.org/docs/#api/en/lights/PointLight
        this.torch.position.copy(this.mainCamera.position);
        this.scene.add(this.torch);

        this.textures = [];

        for (const textureFile of textureFilenames) {
            const tex = new THREE.TextureLoader().load(textureFile, (t) => {
                t.magFilter = THREE.NearestFilter; // no smoothing when scaling up
                t.minFilter = THREE.NearestFilter; // no mipmaps / no smoothing when scaling down
                t.generateMipmaps = false; // don’t build mipmaps
            });
            this.textures.push(tex);
        }

        //
        // Sprites
        //
        /** @type {THREE.Sprite[]} */
        this.sprites = [];

        //
        this.initMap();

        //
        this.renderer.setSize(this.asciiWidth * 1, this.asciiHeight * 1);
        this.renderFrame();
    }

    initMap() {
        const wallPlanes = [];
        const sprites = [];

        //
        // -------------
        // PARSE THE MAP
        // -------------
        /** @type {Map<number,Array} */
        this.map.forEach((/** @type {Tile} */ tile, /** @type {number} */ x, /** @type {number} y */ y) => {
            //
            if (tile.isStartLocation) {
                this.mainCamera.position.set(x, y, 0);
                this.mainCamera.lookAt(x, y - 1, 0);
                this.torch.position.copy(this.mainCamera.position);

                console.log("Initial Camera Position:", this.mainCamera.position);
                return;
            }

            if (tile.isWall) {
                if (!this.map.isWall(x, y + 1)) {
                    wallPlanes.push([x, y + 0.5, Math.PI * 0.0]);
                }
                if (!this.map.isWall(x + 1, y)) {
                    wallPlanes.push([x + 0.5, y, Math.PI * 0.5]);
                }
                if (!this.map.isWall(x, y - 1)) {
                    wallPlanes.push([x, y - 0.5, Math.PI * 1.0]);
                }
                if (!this.map.isWall(x - 1, y)) {
                    wallPlanes.push([x - 0.5, y, Math.PI * 1.5]);
                }
                return;
            }

            if (tile.isEncounter) {
                console.log("Sprite", tile);
                sprites.push([x, y, tile.textureId]);
                return;
            }

            // TODO: Sprites, doors, etc
        });

        //
        // ---------------------------
        // FLOOR (XY PLANE AT Z = -.5)
        // ---------------------------
        const floorGeo = new THREE.PlaneGeometry(this.map.width, this.map.height);
        const floorMat = new THREE.MeshStandardMaterial({
            color: this.floorColor /* side: THREE.DoubleSide */,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(this.map.width / 2, this.map.height / 2, -0.5);
        this.scene.add(floor);

        //
        // -----------------------------
        // CEILING (XY PLANE AT Z = .5)
        // -----------------------------
        const ceilingGeo = new THREE.PlaneGeometry(this.map.width, this.map.height);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: this.ceilingColor,
            side: THREE.BackSide,
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.position.set(this.map.width / 2, this.map.height / 2, 0.5);
        this.scene.add(ceiling);

        //
        // ------
        // WALLS
        // ------
        const wallGeo = new THREE.PlaneGeometry();
        wallGeo.rotateX(Math.PI / 2); // Get the geometry-plane the right way up (z-up)
        wallGeo.rotateY(Math.PI); // rotate textures to be the right way up

        const instancedMesh = new THREE.InstancedMesh(
            wallGeo,
            new THREE.MeshStandardMaterial({ map: this.textures[0] }),
            wallPlanes.length,
        );
        instancedMesh.userData.pastelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });

        instancedMesh.userData.parimaryMaterial = instancedMesh.material;
        this.scene.add(instancedMesh);

        // Temp objects for generating matrices
        const dummy = new THREE.Object3D();

        wallPlanes.forEach((coords, idx) => {
            const [x, y, rot] = coords;
            dummy.position.set(x, y, 0);
            dummy.rotation.set(Math.PI, 0, rot);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(idx, dummy.matrix);
        });
        instancedMesh.instanceMatrix.needsUpdate = true;

        //
        // -------
        // SPRITES
        // -------
        //
        for (const [x, y, textureId] of sprites) {
            // TODO: only one material per sprite type
            const spriteMat = new THREE.SpriteMaterial({
                map: this.textures[textureId],
                transparent: true,
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(x, y, 0);
            sprite.userData.mapLocation = new Vector3(x, y, 0); // The location (in tilemap coordinates) of this sprite
            this.sprites.push(sprite);
            this.scene.add(sprite);
            console.log({ x, y, textureId });
        }
    }

    renderFrame(posX, posY, dirAngle, commit = true) {
        //
        const posV = new Vector3(posX, posY, 0);

        //
        // -------------------------------
        // Camera Position and Orientation
        // -------------------------------
        //
        // Direction we're looking
        const lookDirV = new Vector3(1, 0, 0)
            .applyAxisAngle(new Vector3(0, 0, 1), dirAngle)
            .setZ(0)
            .normalize();

        //
        // The Point we're looking at.
        //
        const lookAtV = lookDirV.clone().add(posV);
        lookAtV.z = 0;

        this.mainCamera.position.copy(posV); //  Move the camera
        this.mainCamera.lookAt(lookAtV); //      Rotate the camera

        // -----
        // TORCH
        // -----
        //
        // The torch should hover right above the camera
        this.torch.position.set(posV.x, posV.y, posV.z + 0.25);

        // -------
        // SPRITES
        // -------
        //
        this.sprites.forEach((sprite) => {
            //
            // The tilemap position (vector) of the sprite
            /** @type {Vector3} */
            const spriteCenterV = sprite.userData.mapLocation;

            //
            // Direction from sprite to camera
            const dir = new Vector3().subVectors(spriteCenterV, posV);
            const len = dir.length();

            //
            if (len > this.viewDistance) {
                // Sprite is out of range, do nothing
                return;
            }

            if (Math.abs(dir.x) > 1e-6 && Math.abs(dir.y) > 1e-6) {
                // Sprite is not in a direct cardinal line to us, do nothing
                return;
            }

            sprite.position.copy(spriteCenterV).addScaledVector(lookDirV, -0.5);
        });

        performance.mark("scene_render_start");
        this.renderer.render(this.scene, this.mainCamera);
        performance.mark("scene_render_end");
        performance.measure("3D Scene Rendering", "scene_render_start", "scene_render_end");

        //
        //
        // ----------------
        // ASCII Conversion
        // ----------------
        //
        performance.mark("asciification_start");
        const gl = this.renderer.getContext();
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;

        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        let idx = 0;
        for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                const cssColor =
                    "#" + //
                    r.toString(16).padStart(2, "0") +
                    g.toString(16).padStart(2, "0") +
                    b.toString(16).padStart(2, "0");

                this.window.put(x, y, "#", cssColor);

                idx += 4;
            }
        }
        performance.mark("asciification_end");
        performance.measure(
            "Asciification", // The name for our measurement
            "asciification_start", // The starting mark
            "asciification_end", // The ending mark
        );

        //
        if (commit) {
            performance.mark("dom_commit_start");
            this.window.commitToDOM();
            performance.mark("dom_commit_end");
            performance.measure("DOM Commit", "dom_commit_start", "dom_commit_end");
        }
    }
}

if (Math.PI < 0 && AsciiWindow && TileMap && Tile) {
    ("STFU Linda");
}
