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
        // Scratch vectors to reduce GC
        this._tempVec1 = new THREE.Vector3();
        this._tempVec2 = new THREE.Vector3();
        this._tempVec2D = new THREE.Vector2();
        // Bolt: Add scratch matrix for collision checks
        this._tempMat = new THREE.Matrix4();
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
        const nearby = this.spatialHash.query(dronePos.x, dronePos.z);

        // Narrowphase: Sphere vs Geometry
        const hits = [];
        this._tempSphere.set(dronePos, radius);
        const droneSphere = this._tempSphere;

        // Check Static Colliders
        for (const other of nearby) {
            this._checkObject(other, droneSphere, hits);
        }

        // Check Dynamic Colliders (Cars)
        // Bolt: Iterate separately to avoid allocating new array with .concat()
        if (dynamicColliders.length > 0) {
            for (const other of dynamicColliders) {
                this._checkObject(other, droneSphere, hits);
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

    _checkObject(other, sphere, hits) {
        if (other.type === 'ring') {
            // Sphere vs Torus (approximated)
            // Transform sphere center to torus local space
            // Bolt: Use scratch matrix to avoid allocation
            const invMat = this._tempMat.copy(other.mesh.matrixWorld).invert();
            const localPos = this._tempVec1.copy(sphere.center).applyMatrix4(invMat);

            // Torus (XY plane): R = 1.5 (major), r = 0.2 (tube)
            // Closest point on central circle
            const R = 1.5;
            const r = 0.2;

            // Vector on XY plane
            const vXY = this._tempVec2D.set(localPos.x, localPos.y);
            const len = vXY.length();

            if (len > 0.0001) {
                vXY.normalize().multiplyScalar(R);
            } else {
                vXY.set(R, 0); // Arbitrary if at center
            }

            const closestOnCircle = this._tempVec2.set(vXY.x, vXY.y, 0);

            // Distance from sphere center to closest circle point
            const dist = localPos.distanceTo(closestOnCircle);

            // Collision if dist < r + radius
            if (dist < r + sphere.radius) {
                // Hit!
                // We use a new vector for normal because hits array persists and needs unique objects
                const localNormal = new THREE.Vector3().subVectors(localPos, closestOnCircle).normalize();
                const normal = localNormal.transformDirection(other.mesh.matrixWorld).normalize();
                const penetration = (r + sphere.radius) - dist;

                hits.push({
                    object: other,
                    normal: normal,
                    penetration: penetration
                });
            }

        } else {
            // Medium Phase: Check Bounding Volume (Sphere or Box)
            // Bolt: Prefer Sphere for dynamic objects (faster update), fallback to Box
            let hitMedium = false;

            if (other.boundingSphere) {
                if (other.boundingSphere.intersectsSphere(sphere)) hitMedium = true;
            } else if (other.box) {
                if (other.box.intersectsSphere(sphere)) hitMedium = true;
            }

            if (hitMedium) {
                // Narrow Phase: Check individual meshes inside the group
                if (other.mesh) {
                    this._checkMeshRecursively(other.mesh, sphere, hits, other);
                } else if (other.box) {
                    // Fallback for simple objects without a mesh reference
                    this._addBoxHit(other.box, sphere, other, hits);
                }
            }
        }
    }

    _checkMeshRecursively(object, sphere, hits, rootEntity) {
        // If it's a Mesh (and visible), check its bounding box
        if (object.isMesh && object.visible) {
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
        // Reuse tempVec1 to avoid allocation
        const closestPoint = this._tempVec1.copy(sphere.center).clamp(box.min, box.max);

        // Calculate distance
        const dist = sphere.center.distanceTo(closestPoint);
        const penetration = sphere.radius - dist;

        if (penetration > 0) {
            // Allocate new Vector3 only on confirmed hit
            const normal = new THREE.Vector3().subVectors(sphere.center, closestPoint).normalize();

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
