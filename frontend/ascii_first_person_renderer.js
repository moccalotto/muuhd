import { TileMap, Tile } from "./ascii_tile_map.js";
import { AsciiWindow } from "./ascii_window.js";
import * as THREE from "three";
import eobWallUrl1 from "./eob1.png";
import gnollSpriteUrl from "./gnoll.png";

export const DefaultRendererOptions = {
    viewDistance: 5,
    fov: Math.PI / 3, // 60 degrees - good for spooky

    wallChar: "#",

    floorColor: 0x654321,
    floorChar: "f",
    ceilingColor: 0x555555,
    ceilingChar: "c",
    fadeOutColor: 0x555555,
};

export class FirstPersonRenderer {
    /**
     * @param {AsciiWindow} aWindow the window we render onto.
     * @param {TileMap} map
     * @param {string[]} textureFilenames
     */
    constructor(aWindow, map, textureFilenames, options) {
        const w = 600;
        const h = 400;

        this.fov = options.fov ?? DefaultRendererOptions.fov;
        this.viewDistance = options.viewDistance ?? DefaultRendererOptions.viewDistance;

        this.window = aWindow;
        this.map = map;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera((this.fov * 180) / Math.PI, w / h);
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Do not anti-alias, it could interfere with the conversion to ascii

        //
        // Fog, Fadeout & Background
        //
        this.scene.background = new THREE.Color(0);
        this.scene.fog = new THREE.Fog(0, 0, this.viewDistance - 1);

        //
        // Camera
        //
        this.camera.up.set(0, 0, 1); // Z-up instead of Y-up

        //
        // Torch
        //
        this.torch = new THREE.PointLight(0xffffff, 0.9, this.viewDistance, 2); // https://threejs.org/docs/#api/en/lights/PointLight
        this.torch.position.copy(this.camera.position);
        this.scene.add(this.torch);

        //
        // Sprites
        //
        /** @type {THREE.Sprite[]} */
        this.sprites = [];

        //
        this.initMap();

        //
        this.renderer.setSize(w, h);
        document.getElementById("threejs").appendChild(this.renderer.domElement);
        this.renderFrame();
    }

    initMap() {
        const wallPlanes = [];
        const sprites = [];

        /** @type {Map<number,Array} */
        this.map.forEach((/** @type {Tile} */ tile, /** @type {number} */ x, /** @type {number} y */ y) => {
            //
            if (tile.isStartLocation) {
                this.camera.position.set(x, y, 0);
                this.camera.lookAt(x, y - 1, 0);
                this.torch.position.copy(this.camera.position);

                console.log("Initial Camera Position:", this.camera.position);
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

            if (tile.isSprite) {
                console.log("Sprite", tile);
                sprites.push([x, y, tile.textureId]);
                return;
            }

            // TODO: Sprites, doors, etc
        });

        //
        // Floor (XY plane at Z = -.5)
        //
        const floorGeo = new THREE.PlaneGeometry(this.map.width, this.map.height);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x964b00 /* side: THREE.DoubleSide */ });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(this.map.width / 2, this.map.height / 2, -0.5);
        this.scene.add(floor);

        //
        // Ceiling (XY plane at Z = .5)
        //
        const ceilingGeo = new THREE.PlaneGeometry(this.map.width, this.map.height);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.BackSide });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.position.set(this.map.width / 2, this.map.height / 2, 0.5);
        this.scene.add(ceiling);

        //
        // Walls
        //
        const wallTex = new THREE.TextureLoader().load(eobWallUrl1, (texture) => {
            texture.magFilter = THREE.NearestFilter; // no smoothing when scaling up
            texture.minFilter = THREE.NearestFilter; // no mipmaps / no smoothing when scaling down
            texture.generateMipmaps = false; // don’t build mipmaps
        });

        const wallGeo = new THREE.PlaneGeometry();
        wallGeo.rotateX(Math.PI / 2); // Get the geometry-plane the right way up (z-up)
        // wallGeo.rotateY(Math.PI); // rotate textures to be the right way up

        const instancedMesh = new THREE.InstancedMesh(
            wallGeo,
            new THREE.MeshStandardMaterial({ map: wallTex }),
            wallPlanes.length,
        );
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
        // Sprites
        //
        // Load a sprite texture

        const tex = new THREE.TextureLoader().load(gnollSpriteUrl, (t) => {
            t.magFilter = THREE.NearestFilter; // pixel-art crisp
            t.minFilter = THREE.NearestFilter;
            t.generateMipmaps = false;
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(1, 1);
        });

        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });

        for (const [x, y, textureId] of sprites) {
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(
                x,
                y,
                0, // z (stand on floor)
            );
            sprite.position.set(x, y, 0);
            this.sprites.push(sprite);
            this.scene.add(sprite);
            console.log({ x, y, textureId });
        }
    }

    renderFrame(posX, posY, dirAngle, commit = true) {
        this.renderer.render(this.scene, this.camera);
        const lookAtV = new THREE.Vector3(1, 0, 0);
        lookAtV
            .applyAxisAngle(new THREE.Vector3(0, 0, 1), dirAngle)
            .normalize()
            .add(this.camera.position);

        this.camera.position.x = posX;
        this.camera.position.y = posY;

        this.torch.position.copy(this.camera.position);
        this.torch.position.z += 0.25;
        this.camera.lookAt(lookAtV);

        //
        if (commit) {
            this.window.commitToDOM();
        }
    }
}

if (Math.PI < 0 && AsciiWindow && TileMap && Tile) {
    ("STFU Linda");
}
