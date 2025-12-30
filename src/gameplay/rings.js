// src/gameplay/rings.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { RingEntity } from '../world/entities/ring.js';

export class RingManager {
    constructor(scene, drone, colliderSystem) {
        this.scene = scene;
        this.drone = drone;
        this.colliderSystem = colliderSystem;
        this.rings = [];
        this.collectedCount = 0;

        // Spawn timer
        this.spawnTimer = 0;
        this.spawnInterval = 4.0; // 4s

        // Initial ring
        this.spawnRing();
    }

    clear() {
        this.rings.forEach(r => {
            if (r.entity) {
                window.app.world.removeEntity(r.entity);
            } else if (r.mesh) {
                this.scene.remove(r.mesh);
            }
        });
        this.rings = [];
        this.collectedCount = 0;
    }

    loadRings(ringsData) {
        // Deprecated: Rings are now entities saved in world.objects
        // But for compatibility with old saves or dedicated ring management:
        this.clear();
        if (!ringsData) return;
        ringsData.forEach(rData => {
            this.spawnRingAt(rData.position, rData.rotation);
        });
    }

    spawnRingAt(pos, rot) {
        // Use RingEntity
        const params = {
            x: pos.x,
            y: pos.y,
            z: pos.z
        };
        const ringEntity = new RingEntity(params);
        ringEntity.init(window.app.world);

        // Manual override for rotation if provided (Entity system defaults to 0)
        if (rot) {
            ringEntity.mesh.rotation.set(rot.x, rot.y, rot.z);
            ringEntity.mesh.updateMatrix();
        } else {
             ringEntity.mesh.rotation.set(0, Math.random() * Math.PI, 0);
             ringEntity.mesh.updateMatrix();
        }

        window.app.world.addEntity(ringEntity);
        // Do NOT add to colliderSystem as static. Rings are triggers managed by RingEntity.
        // this.colliderSystem.addStatic([ringEntity]);

        // Explicitly add to local list to ensure registration even if global app.rings isn't ready
        this.add(ringEntity);
    }

    add(entity) {
        if (!this.rings.find(r => r.entity === entity)) {
            this.rings.push({ entity: entity, mesh: entity.mesh });
        }
    }

    remove(entity) {
        const idx = this.rings.findIndex(r => r.entity === entity);
        if (idx > -1) this.rings.splice(idx, 1);
    }

    exportRings() {
        // Rings are now part of world.objects so we return empty to avoid duplication in save file
        // Or if we want to maintain separation...
        // The user wants rings to be vehicles. Vehicles are entities.
        // So they should be managed by World.
        return [];
    }

    update(dt) {
        // Spawning
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval && this.rings.length < 9) {
            this.spawnRing();
            this.spawnTimer = 0;
        }

        // Check Collection
        const toRemove = [];

        // Filter out rings that might have been deleted by Dev Mode or other systems
        this.rings = this.rings.filter(r => r.mesh.parent !== null);

        this.rings.forEach(ring => {
            if (!ring.mesh) return;

            // Check Collection: Must pass through center
            // Transform drone pos to Ring Local Space
            // Note: RingEntity has a modelGroup inside mesh, but mesh is the top level wrapper.
            // The Torus geometry is inside modelGroup.
            // RingEntity creates mesh -> modelGroup -> torusMesh
            // We need to check relative to the Torus.

            // Access inner torus mesh for correct local space?
            // RingEntity structure: mesh (Group) -> modelGroup (Group) -> mesh (Torus)
            // But matrixWorld of the top group is enough if modelGroup and torus are identity/aligned.
            // Let's use the top mesh.

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
            return true;
        }
        return false;
    }

    spawnRing() {
        // Attempt to find a valid position
        let x, y, z;
        let valid = false;
        const ringRadius = 2.0;

        for (let i = 0; i < 10; i++) {
            x = (Math.random() - 0.5) * 400;
            z = (Math.random() - 0.5) * 400;
            y = 5 + Math.random() * 35;

            if (this.colliderSystem) {
                const pos = new THREE.Vector3(x, y, z);
                const hits = this.colliderSystem.checkCollisions(pos, ringRadius);
                if (hits.length === 0) {
                    valid = true;
                    break;
                }
            } else {
                valid = true;
                break;
            }
        }

        if (!valid) {
            console.warn("RingManager: Could not find valid spawn position after 10 attempts. Spawning at last generated pos.");
        }

        this.spawnRingAt({x, y, z});
    }

    collectRing(ring) {
        if (ring.entity) {
            window.app.world.removeEntity(ring.entity);
        } else if (ring.mesh) {
            this.scene.remove(ring.mesh);
        }

        const idx = this.rings.indexOf(ring);
        if (idx > -1) this.rings.splice(idx, 1);

        this.collectedCount++;
    }

    reset() {
        this.clear();
        this.spawnRing();
    }
}
