// src/world/world.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.ground = null;

        this._initGround();
        this._initLighting();
        this._generateDowntown(); // Placeholder generation
    }

    _initGround() {
        // Infinite grid illusion: A large plane that moves with the player (later optimization)
        // For now, a fixed large plane
        const geo = new THREE.PlaneGeometry(1000, 1000);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x223322,
            roughness: 0.8,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    _initLighting() {
        // Already done in App, but good to move here eventually.
        // For MVP, we assume lights are set up in App or passed in.
        // We will leave App's lighting for now to avoid duplication conflicts.
    }

    _generateDowntown() {
        // Simple grid of blocks
        const blockSize = 20;
        const streetWidth = 10;
        const buildingColor = 0x888899;

        const mat = new THREE.MeshStandardMaterial({ color: buildingColor });

        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                if (x === 0 && z === 0) continue; // Leave center open for spawn

                const height = 10 + Math.random() * 30;
                const geo = new THREE.BoxGeometry(blockSize, height, blockSize);
                const mesh = new THREE.Mesh(geo, mat);

                mesh.position.set(
                    x * (blockSize + streetWidth),
                    height / 2,
                    z * (blockSize + streetWidth)
                );

                mesh.castShadow = true;
                mesh.receiveShadow = true;

                this.scene.add(mesh);

                // Track for collision
                // We'll calculate AABB manually later or use Box3
                mesh.geometry.computeBoundingBox();
                const box = new THREE.Box3().copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
                this.buildings.push({
                    mesh: mesh,
                    box: box
                });
            }
        }
    }

    // API for collisions
    getStaticColliders() {
        return this.buildings;
    }
}
