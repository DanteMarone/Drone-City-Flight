// src/gameplay/rings.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Bolt: Scratch objects to prevent GC
const _tempVec = new THREE.Vector3();
const _tempMat = new THREE.Matrix4();

export class RingManager {
    constructor(scene, drone, colliderSystem) {
        this.scene = scene;
        this.drone = drone;
        this.colliderSystem = colliderSystem;
        this.rings = [];
        this._cachedColliders = []; // Bolt: Cache for physics
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

    // Bolt: Expose cached colliders to avoid mapping in update
    getColliders() {
        return this._cachedColliders;
    }

    clear() {
        this.rings.forEach(r => this.scene.remove(r.mesh));
        this.rings = [];
        this._cachedColliders = [];
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
        const ringObj = { mesh };
        this.rings.push(ringObj);

        // Bolt: Add to cache
        this._cachedColliders.push({
            type: 'ring',
            mesh: mesh,
            box: null
        });
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

            // Bolt: Transform drone pos to Ring Local Space without allocation
            // localPos = drone.pos * inv(ringMatrix)

            // Calculate Inverse World Matrix
            _tempMat.copy(ring.mesh.matrixWorld).invert();

            // Transform Drone Position (using scratch vector)
            const localPos = _tempVec.copy(this.drone.position).applyMatrix4(_tempMat);

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
        // Attempt to find a valid position
        let x, y, z;
        let valid = false;
        const ringRadius = 2.0; // Slightly larger than 1.7 (1.5+0.2)

        for (let i = 0; i < 10; i++) {
            // Range: +/- 200 (District bounds)
            // Height: 5 - 40
            x = (Math.random() - 0.5) * 400;
            z = (Math.random() - 0.5) * 400;
            y = 5 + Math.random() * 35;

            if (this.colliderSystem) {
                const pos = new THREE.Vector3(x, y, z);
                const hits = this.colliderSystem.checkCollisions(pos, ringRadius);
                // checkCollisions returns hits including ground if y < radius.
                // At min height 5, y > radius (2), so ground hit shouldn't happen unless terrain is high?
                // But checkCollisions only checks infinite plane at y=0.
                if (hits.length === 0) {
                    valid = true;
                    break;
                }
            } else {
                // No collider system (e.g. init or tests), assume valid
                valid = true;
                break;
            }
        }

        if (!valid) {
            console.warn("RingManager: Could not find valid spawn position after 10 attempts. Spawning at last generated pos.");
        }

        const mesh = new THREE.Mesh(this.geo, this.mat);
        mesh.position.set(x, y, z);
        mesh.rotation.x = Math.PI / 2; // Face up? Or face forward?
        // Torus is XY plane. We want it vertical usually?
        // Let's make it vertical facing random direction
        mesh.rotation.x = 0;
        mesh.rotation.y = Math.random() * Math.PI;

        this.scene.add(mesh);

        const ringObj = { mesh };
        this.rings.push(ringObj);

        // Bolt: Add to cache
        this._cachedColliders.push({
            type: 'ring',
            mesh: mesh,
            box: null
        });
    }

    collectRing(ring) {
        this.scene.remove(ring.mesh);
        const idx = this.rings.indexOf(ring);
        if (idx > -1) {
            this.rings.splice(idx, 1);
            // Bolt: Remove from cache
            this._cachedColliders.splice(idx, 1);
        }

        this.collectedCount++;
    }

    reset() {
        this.rings.forEach(r => this.scene.remove(r.mesh));
        this.rings = [];
        this._cachedColliders = [];
        this.collectedCount = 0;
        this.spawnRing();
    }
}
