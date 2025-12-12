// src/world/colliders.js
import { SpatialHash } from '../utils/spatialHash.js';
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class ColliderSystem {
    constructor() {
        this.spatialHash = new SpatialHash(CONFIG.WORLD.CHUNK_SIZE);
        this.staticColliders = [];
    }

    addStatic(colliders) {
        // Expects array of { mesh, box: Box3 }
        colliders.forEach(c => {
            this.staticColliders.push(c);
            this.spatialHash.insert(c, c.box);
        });
    }

    checkCollisions(dronePos, radius) {
        // Broadphase
        const nearby = this.spatialHash.query(dronePos.x, dronePos.z);

        // Narrowphase: Sphere vs AABB
        const hits = [];
        const droneSphere = new THREE.Sphere(dronePos, radius);

        for (const other of nearby) {
            if (other.box.intersectsSphere(droneSphere)) {
                // Detailed hit info
                // Clamp center to box to find closest point
                const closestPoint = new THREE.Vector3().copy(dronePos).clamp(other.box.min, other.box.max);
                const normal = new THREE.Vector3().subVectors(dronePos, closestPoint).normalize();

                // Penetration depth
                const dist = dronePos.distanceTo(closestPoint);
                const penetration = radius - dist;

                hits.push({
                    object: other,
                    normal: normal,
                    penetration: penetration
                });
            }
        }

        // Also check ground (Infinite plane at y=0)
        if (dronePos.y < radius) {
            hits.push({
                object: { type: 'ground' },
                normal: new THREE.Vector3(0, 1, 0),
                penetration: radius - dronePos.y
            });
        }

        return hits;
    }
}
