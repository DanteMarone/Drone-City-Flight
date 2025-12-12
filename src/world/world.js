// src/world/world.js
import * as THREE from 'three';
import { DistrictGenerator } from './generation.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.ground = null;

        this._initGround();
        this._generateWorld();
    }

    _initGround() {
        const geo = new THREE.PlaneGeometry(2000, 2000);
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

    _generateWorld() {
        // Use the new generator
        const generator = new DistrictGenerator(this.scene);
        this.colliders = generator.generateCityLayout();
    }

    // API for collisions
    getStaticColliders() {
        return this.colliders;
    }
}
