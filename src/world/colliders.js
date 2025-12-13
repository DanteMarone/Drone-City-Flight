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
            if (c.box) { // Only add if it has a bounding box (roads might not)
                this.staticColliders.push(c);
                this.spatialHash.insert(c, c.box);
            }
        });
    }

    remove(mesh) {
        // Find collider wrapper for this mesh
        const initialLength = this.staticColliders.length;
        this.staticColliders = this.staticColliders.filter(c => c.mesh !== mesh);

        if (this.staticColliders.length !== initialLength) {
            // Rebuild Spatial Hash
            this.spatialHash.clear();
            this.staticColliders.forEach(c => {
                this.spatialHash.insert(c, c.box);
            });
        }
    }

    updateBody(mesh) {
        // Find collider wrapper for this mesh
        const collider = this.staticColliders.find(c => c.mesh === mesh);

        if (collider) {
            // Update box to match new mesh transform
            collider.box.setFromObject(mesh);

            // Rebuild Spatial Hash (easiest way to move it)
            this.remove(mesh);
            this.staticColliders.push(collider);
            this.spatialHash.insert(collider, collider.box);
        }
    }

    clear() {
        this.staticColliders = [];
        this.spatialHash.clear();
    }

    checkCollisions(dronePos, radius, dynamicColliders = []) {
        // Broadphase Static
        let nearby = this.spatialHash.query(dronePos.x, dronePos.z);

        // Add Dynamic (Cars)
        if (dynamicColliders.length > 0) {
            nearby = nearby.concat(dynamicColliders);
        }

        // Narrowphase: Sphere vs AABB
        const hits = [];
        const droneSphere = new THREE.Sphere(dronePos, radius);

        for (const other of nearby) {
            if (other.type === 'ring') {
                 // Sphere vs Torus (approximated)
                 // Transform sphere center to torus local space
                 const invMat = other.mesh.matrixWorld.clone().invert();
                 const localPos = dronePos.clone().applyMatrix4(invMat);

                 // Torus (XY plane): R = 1.5 (major), r = 0.2 (tube)
                 // Closest point on central circle
                 const R = 1.5;
                 const r = 0.2;

                 // Vector on XY plane
                 const vXY = new THREE.Vector2(localPos.x, localPos.y);
                 const len = vXY.length();

                 if (len > 0.0001) {
                     vXY.normalize().multiplyScalar(R);
                 } else {
                     vXY.set(R, 0); // Arbitrary if at center
                 }

                 const closestOnCircle = new THREE.Vector3(vXY.x, vXY.y, 0);

                 // Distance from sphere center to closest circle point
                 const dist = localPos.distanceTo(closestOnCircle);

                 // Collision if dist < r + radius
                 if (dist < r + radius) {
                     // Hit!
                     const localNormal = new THREE.Vector3().subVectors(localPos, closestOnCircle).normalize();
                     const normal = localNormal.transformDirection(other.mesh.matrixWorld).normalize();
                     const penetration = (r + radius) - dist;

                     hits.push({
                         object: other,
                         normal: normal,
                         penetration: penetration
                     });
                 }

            } else if (other.box && other.box.intersectsSphere(droneSphere)) {
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
