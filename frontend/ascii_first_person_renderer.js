import { TileMap } from "./ascii_tile_map.js";
import { PlayerStartTile, Tile } from "./ascii_tile_types.js";
import { AsciiWindow } from "./ascii_window.js";
import * as THREE from "three";
import { Vector3 } from "three";

export const DefaultRendererOptions = {
    viewDistance: 5, // number of tiles we can see ahead
    fov: 70, // degrees

    floorColor: 0x654321,
    ceilingColor: 0x555555,

    commitToDOM: true,

    fillChar: "#",
};

export class FirstPersonRenderer {
    /**
     * @param {AsciiWindow} aWindow the window we render onto.
     * @param {TileMap} map
     */
    constructor(aWindow, map, options) {
        this.map = map;
        this.window = aWindow;

        //
        // Window geometry
        //
        this.widthPx = aWindow.htmlElement.clientWidth;
        this.heightPx = aWindow.htmlElement.clientHeight;
        this.asciiWidth = aWindow.width;
        this.asciiHeight = aWindow.height;
        this.aaspect = this.widthPx / this.heightPx;

        //
        // Rendering options
        //
        this.fov = options.fov ?? DefaultRendererOptions.fov;
        this.viewDistance = options.viewDistance ?? DefaultRendererOptions.viewDistance;
        this.floorColor = options.floorColor ?? DefaultRendererOptions.floorColor;
        this.ceilingColor = options.ceilingColor ?? DefaultRendererOptions.ceilingColor;
        this.commitToDOM = options.commitToDOM ?? DefaultRendererOptions.commitToDOM;
        this.fillChar = options.fillChar ?? DefaultRendererOptions.fillChar;

        //
        // THREE variables
        //
        this.scene = new THREE.Scene();
        this.mainCamera = new THREE.PerspectiveCamera(this.fov, this.aspect, 0.1, this.viewDistance);
        this.renderer = new THREE.WebGLRenderer({
            antialias: false, //                Do not AA - it ruins asciification
            preserveDrawingBuffer: true, //     Preserve the rendering buffer so we can access it during asciification
        });

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

        //
        // Caches
        //
        /** @type {Map<string|number,THREE.Texture} Textures - one per unique textureId (i.e. filename) */
        this.textures = new Map();
        /** @type {Map<string|number,THREE.Material} Sprite materials - one material per unique sprite texture  */
        this.spriteMaterials = new Map();
        /** @type {THREE.Sprite[]} All roaming tiles that regularly needs their positions updated */
        this.roamers = [];

        /** @type {number} how many asynchronous function returns are we waiting for? */
        this.openAsyncs = 0;
        /** @type {boolean} Are we ready to render? (have all resources been loaded?) */
        this.ready = false;
        /** @type {function} called when the renderer is ready and all resources have been loaded */
        this.onReady = null;

        //
        this.initMap();

        //
        this.renderer.setSize(this.asciiWidth * 1, this.asciiHeight * 1);

        const waitForAsyncs = () => {
            if (this.ready) {
                return;
            }
            if (this.openAsyncs > 0) {
                setTimeout(waitForAsyncs, 100);
                return;
            }

            this.ready = true;
            if (typeof this.onReady === "function") {
                this.onReady();
                return;
            }

            this.renderFrame();
        };
        setTimeout(waitForAsyncs, 100);
    }

    getTexture(textureId) {
        let texture = this.textures.get(textureId);
        if (!texture) {
            this.openAsyncs++;
            texture = new THREE.TextureLoader().load(`${textureId}.png`, (t) => {
                t.magFilter = THREE.NearestFilter; // no smoothing when scaling up
                t.minFilter = THREE.NearestFilter; // no mipmaps / no smoothing when scaling down
                t.generateMipmaps = false; // don’t build mipmaps
                this.openAsyncs--;
            });
            this.textures.set(textureId, texture);
        }

        if (!texture) {
            console.warn("    texture could not be loaded", { textureId, texture });
        }

        return texture;
    }

    getSpriteMaterial(textureId) {
        let material = this.spriteMaterials.get(textureId);

        if (!material) {
            material = new THREE.SpriteMaterial({
                map: this.getTexture(textureId),
                transparent: true,
            });

            this.spriteMaterials.set(textureId, material);
        }

        return material;
    }

    initMap() {
        const wallPlanes = [];
        const roamers = [];

        //
        // -------------
        // PARSE THE MAP
        // -------------
        /** @type {Map<number,Array} */
        this.map.forEach((/** @type {Tile} */ tile, /** @type {number} */ x, /** @type {number} y */ y) => {
            tile.textureId !== null && tile.textureId !== undefined && this.getTexture(tile.textureId);

            //
            if (tile instanceof PlayerStartTile) {
                //
                // This is temporary - the one that calls render() will determine the camera's
                // position and orientation
                //
                this.mainCamera.position.set(x, y, 0);
                this.mainCamera.lookAt(x, y - 1, 0);
                this.torch.position.copy(this.mainCamera.position);

                return;
            }

            if (tile.looksLikeWall) {
                if (!this.map.looksLikeWall(x, y + 1)) {
                    wallPlanes.push([x, y + 0.5, Math.PI * 0.0]);
                }
                if (!this.map.looksLikeWall(x + 1, y)) {
                    wallPlanes.push([x + 0.5, y, Math.PI * 0.5]);
                }
                if (!this.map.looksLikeWall(x, y - 1)) {
                    wallPlanes.push([x, y - 0.5, Math.PI * 1.0]);
                }
                if (!this.map.looksLikeWall(x - 1, y)) {
                    wallPlanes.push([x - 0.5, y, Math.PI * 1.5]);
                }
                return;
            }

            if (tile.isRoaming) {
                roamers.push([x, y, tile]);
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
            color: this.floorColor,
            /* side: THREE.DoubleSide */
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
        const wallTextureId = this.map.getReferenceWallTile().textureId;

        const instancedMesh = new THREE.InstancedMesh(
            wallGeo,
            new THREE.MeshStandardMaterial({
                map: this.getTexture(wallTextureId),
            }),
            wallPlanes.length,
        );

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
        // Roamers
        // -------
        //
        // Roaming tiles (e.g. encounters)
        //
        for (const [x, y, tile] of roamers) {
            const textureId = tile.textureId;

            if (!textureId) {
                console.warn("invalid textureId", { x, y, textureId });
            }

            const roamerSprite = new THREE.Sprite(this.getSpriteMaterial(textureId));
            roamerSprite.position.set(x, y, 0);
            roamerSprite.userData.tile = tile;
            this.roamers.push(roamerSprite);
            this.scene.add(roamerSprite);
        }
    }

    renderFrame(camX, camY, camOrientation) {
        //
        // Camera and lighting
        //
        const camV = new Vector3(camX, camY, 0);
        this.updateCameraPosition(camOrientation, camV);
        this.torch.position.set(camV.x, camV.y, camV.z + 0.25);

        //
        // Update position of roaming entities
        //
        this.updateRoamsers(camV);

        //
        // Render the scene into an image
        //
        this.renderSceneImage();

        //
        // Convert the rendered image to ASCII
        //
        this.renderSceneASCII();
    }

    renderSceneImage() {
        performance.mark("scene_render_start");
        this.renderer.render(this.scene, this.mainCamera);
        performance.mark("scene_render_end");
        performance.measure("3D Scene Rendering", "scene_render_start", "scene_render_end");
    }

    updateCameraPosition(dirAngle, camV) {
        const lookDirV = new Vector3(1, 0, 0)
            .applyAxisAngle(new Vector3(0, 0, 1), dirAngle)
            .setZ(0)
            .normalize();

        //
        // The Point we're looking at.
        //
        const lookAtV = lookDirV.clone().add(camV);
        lookAtV.z = 0;

        this.mainCamera.position.copy(camV); //  Move the camera
        this.mainCamera.lookAt(lookAtV);
    }

    updateRoamsers(camV) {
        this.roamers.forEach((roamerSprite) => {
            /** @type {Tile} */
            const tile = roamerSprite.userData.tile;

            //
            // The map position (vector) of the encounter
            /** @type {Vector3} */
            const roamerTilePosV = new THREE.Vector3(tile.currentPosX, tile.currentPosY, 0);

            // -------------------------------------
            // Move sprite visually closer to camera
            // -------------------------------------
            //
            // Sprites look better if they are right on the
            // edge of their tile, closest to the player.
            //
            //
            // Direction from encounter to camera
            const dirV = new Vector3().subVectors(roamerTilePosV, camV);

            //
            // Is the encounter too far away to see? (manhattan distance for
            if (dirV.manhattanLength() > this.viewDistance) {
                // Encounter is out of range is out of range, do nothing
                return;
            }

            //
            // Set sprite position to the edge of the tile that is closest to the camera
            roamerSprite.position.copy(roamerTilePosV);
            // Magic constant. 0.6 is visually appealing and makes the encounter/sprite
            // look fairly close while still being able to see the entire sprite.
            roamerSprite.position.addScaledVector(dirV.normalize(), -0.6);
        });
    }

    /**
     * Convert rendered image to ASCII (asciification)
     */
    renderSceneASCII() {
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

                this.window.put(x, y, this.fillChar, cssColor);

                idx += 4;
            }
        }
        performance.mark("asciification_end");
        performance.measure(
            "Asciification", // The name for our measurement
            "asciification_start", // The starting mark
            "asciification_end",
        );

        //
        if (this.commitToDOM) {
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
