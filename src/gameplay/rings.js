// src/gameplay/rings.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class RingManager {
    constructor(scene, drone) {
        this.scene = scene;
        this.drone = drone;
        this.rings = [];
        this.collectedCount = 0;

        // Geometry shared
        this.geo = new THREE.TorusGeometry(1.5, 0.2, 8, 16);
        this.mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        // Spawn timer
        this.spawnTimer = 0;
        this.spawnInterval = 4.0; // 4s

        // Initial ring
        this.spawnRing();
    }

    update(dt) {
        // Spawning
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval && this.rings.length < 9) {
            this.spawnRing();
            this.spawnTimer = 0;
        }

        // Animation & Collision
        const toRemove = [];

        this.rings.forEach(ring => {
            // Spin
            ring.mesh.rotation.y += 2.0 * dt;

            // Check Collection
            const dist = ring.mesh.position.distanceTo(this.drone.position);
            // Ring radius 1.5 + Drone radius 0.5 = 2.0 thresh
            if (dist < 2.5) {
                toRemove.push(ring);
            }
        });

        if (toRemove.length > 0) {
            toRemove.forEach(r => this.collectRing(r));
            return true; // Return true if collection happened (for audio/battery)
        }
        return false;
    }

    spawnRing() {
        // Random pos
        // Range: +/- 200 (District bounds)
        // Height: 5 - 40
        const x = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        const y = 5 + Math.random() * 35;

        // TODO: Validity check (raycast or check static colliders)
        // For now, raw random.

        const mesh = new THREE.Mesh(this.geo, this.mat);
        mesh.position.set(x, y, z);
        mesh.rotation.x = Math.PI / 2; // Face up? Or face forward?
        // Torus is XY plane. We want it vertical usually?
        // Let's make it vertical facing random direction
        mesh.rotation.x = 0;
        mesh.rotation.y = Math.random() * Math.PI;

        this.scene.add(mesh);

        this.rings.push({ mesh });
    }

    collectRing(ring) {
        this.scene.remove(ring.mesh);
        const idx = this.rings.indexOf(ring);
        if (idx > -1) this.rings.splice(idx, 1);

        this.collectedCount++;
    }

    reset() {
        this.rings.forEach(r => this.scene.remove(r.mesh));
        this.rings = [];
        this.collectedCount = 0;
        this.spawnRing();
    }
}
