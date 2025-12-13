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

    clear() {
        this.rings.forEach(r => this.scene.remove(r.mesh));
        this.rings = [];
        this.collectedCount = 0;
    }

    loadRings(ringsData) {
        this.clear();
        if (!ringsData) return;
        ringsData.forEach(rData => {
            this.spawnRingAt(rData.position, rData.rotation);
        });
    }

    spawnRingAt(pos, rot) {
        const mesh = new THREE.Mesh(this.geo, this.mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        if (rot) mesh.rotation.set(rot.x, rot.y, rot.z);
        else {
            mesh.rotation.x = 0;
            mesh.rotation.y = Math.random() * Math.PI;
        }

        // Metadata for saving
        mesh.userData.type = 'ring';

        this.scene.add(mesh);
        this.rings.push({ mesh });
    }

    exportRings() {
        return this.rings.map(r => ({
            position: { x: r.mesh.position.x, y: r.mesh.position.y, z: r.mesh.position.z },
            rotation: { x: r.mesh.rotation.x, y: r.mesh.rotation.y, z: r.mesh.rotation.z }
        }));
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
            // Spin: Removed as per request (Rings should not rotate)
            // ring.mesh.rotation.y += 2.0 * dt;

            // Check Collection: Must pass through center
            // Simple check: Distance to center is small, AND aligned with plane?
            // Better: Physics check handles collision with rim.
            // We just need to check if we are inside the 'hole'.
            // Hole radius ~ 1.5 - 0.2 = 1.3. Drone radius 0.5.
            // So if distance < 1.3, we are inside?
            // BUT we must be "inside" the torus plane thickness too.
            // We can check if distance to center < 1.0 (safe margin) AND distance to plane < 0.5.

            // Transform drone pos to Ring Local Space
            const localPos = this.drone.position.clone().applyMatrix4(ring.mesh.matrixWorld.clone().invert());

            // Torus is in XY plane. Z is normal.
            const distToCenter = Math.sqrt(localPos.x*localPos.x + localPos.y*localPos.y);
            const distToPlane = Math.abs(localPos.z);

            if (distToCenter < 1.0 && distToPlane < 0.5) {
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
