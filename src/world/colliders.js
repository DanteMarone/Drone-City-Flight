// src/world/colliders.js
import { SpatialHash } from '../utils/spatialHash.js';
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class ColliderSystem {
    constructor() {
        this.spatialHash = new SpatialHash(CONFIG.WORLD.CHUNK_SIZE);
        this.staticColliders = [];
        this._tempBox = new THREE.Box3();
        this._tempSphere = new THREE.Sphere();
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

        // Narrowphase: Sphere vs Geometry
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
                // Medium Phase: Check if the main AABB is hit
                // Now Narrow Phase: Check individual meshes inside the group
                if (other.mesh) {
                    this._checkMeshRecursively(other.mesh, droneSphere, hits, other);
                } else {
                    // Fallback for simple objects without a mesh reference (shouldn't happen for entities)
                    this._addBoxHit(other.box, droneSphere, other, hits);
                }
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

    _checkMeshRecursively(object, sphere, hits, rootEntity) {
        // If it's a Mesh (and visible), check its bounding box
        if (object.isMesh && object.visible) {
             // We need the world bounding box of this specific mesh
             // Optimization: Instead of full setFromObject (which traverses children),
             // for a leaf mesh we can just transform its geometry box.
             // But setFromObject is robust.

             // Note: setFromObject on a Mesh calculates box of that mesh.
             // If we are iterating, we don't want to re-traverse children if we are already traversing.
             // Standard traverse goes to children.

             // Let's rely on Box3.setFromObject for now, but apply it to the single object.
             // However, `setFromObject` expands by children. If we use `traverse`, we hit children anyway.
             // So we should strictly check the geometry of the current mesh.

             // Calculate World Box for this Mesh Only
             if (object.geometry) {
                 if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();

                 this._tempBox.copy(object.geometry.boundingBox);
                 this._tempBox.applyMatrix4(object.matrixWorld);

                 if (this._tempBox.intersectsSphere(sphere)) {
                     this._addBoxHit(this._tempBox, sphere, rootEntity, hits);
                 }
             }
        }

        // Recursively check children
        if (object.children && object.children.length > 0) {
            for (let i = 0; i < object.children.length; i++) {
                this._checkMeshRecursively(object.children[i], sphere, hits, rootEntity);
            }
        }
    }

    _addBoxHit(box, sphere, object, hits) {
        // Clamp center to box to find closest point
        const closestPoint = new THREE.Vector3().copy(sphere.center).clamp(box.min, box.max);

        // Calculate distance
        const dist = sphere.center.distanceTo(closestPoint);
        const penetration = sphere.radius - dist;

        if (penetration > 0) {
            const normal = new THREE.Vector3().subVectors(sphere.center, closestPoint).normalize();

            // Avoid duplicate hits on the same object?
            // Or maybe keep them and let the physics solver handle multiple constraints?
            // Usually we want the deepest penetration.

            // Check if we already have a hit for this object
            const existingHit = hits.find(h => h.object === object);
            if (existingHit) {
                // If this new hit is deeper, replace it
                if (penetration > existingHit.penetration) {
                    existingHit.penetration = penetration;
                    existingHit.normal = normal;
                }
            } else {
                hits.push({
                    object: object,
                    normal: normal,
                    penetration: penetration
                });
            }
        }
    }
}
