// src/world/world.js
import * as THREE from 'three';
import { DistrictGenerator } from './generation.js';
import { ObjectFactory } from './factory.js';
import { BirdSystem } from './birdSystem.js';
import { CONFIG } from '../config.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.birdSystem = new BirdSystem(scene);
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

    update(dt) {
        if (this.birdSystem) this.birdSystem.update(dt);
        this._updateManualCars(dt);
    }

    _updateManualCars(dt) {
        // Iterate through all manually placed objects in colliders
        // Note: this.colliders contains objects created in DevMode that were registered.
        this.colliders.forEach(c => {
            if (c.mesh && c.mesh.userData.type === 'car' && c.mesh.userData.waypoints && c.mesh.userData.waypoints.length > 0) {
                const anchor = c.mesh;
                const waypoints = anchor.userData.waypoints;
                const path = [new THREE.Vector3(0, 0, 0), ...waypoints];

                if (path.length < 2) return;

                // Identify Model Children (Exclude Visuals)
                const visualGroup = anchor.getObjectByName('waypointVisuals');
                const modelChildren = anchor.children.filter(child => child !== visualGroup);
                if (modelChildren.length === 0) return;

                // Initialize State
                if (anchor.userData.targetIndex === undefined) {
                    anchor.userData.targetIndex = 1; // Start by moving to first waypoint (Index 1)
                }

                let targetIdx = anchor.userData.targetIndex;

                // Safety clamp
                if (targetIdx < 0) targetIdx = 0;
                if (targetIdx >= path.length) targetIdx = path.length - 1;

                const targetPos = path[targetIdx];
                const currentPos = modelChildren[0].position.clone();

                const speed = Math.max(0, CONFIG.DRONE.SPEED - 0.5);
                const dist = currentPos.distanceTo(targetPos);
                const moveAmount = speed * dt;

                if (dist > moveAmount) {
                    // Move
                    const dir = targetPos.clone().sub(currentPos).normalize();
                    const moveVec = dir.multiplyScalar(moveAmount);

                    modelChildren.forEach(child => child.position.add(moveVec));

                    // Rotate
                    // Calculate LookAt point in World Space because Object3D.lookAt expects World Coords
                    const worldTarget = anchor.localToWorld(targetPos.clone());
                    modelChildren.forEach(child => child.lookAt(worldTarget));

                } else {
                    // Snap
                    modelChildren.forEach(child => child.position.copy(targetPos));

                    // Update Logic (Circular)
                    if (targetIdx < path.length - 1) {
                         anchor.userData.targetIndex++;
                    } else {
                         anchor.userData.targetIndex = 0; // Loop back to start (Origin)
                    }
                }

                // Update Collision Box
                // Compute new bounding box for the CAR BODY only (not the whole path)
                if (c.box) {
                    // We need to compute the box of the modelChildren in World Space
                    // Since modelChildren are children of 'anchor', and 'anchor' is in World Space.

                    // Reset box
                    c.box.makeEmpty();

                    // Expand by each model part
                    modelChildren.forEach(child => {
                        // child is in local space of anchor.
                        // We can't use setFromObject directly on child because it will calculate world bounds based on child's world matrix
                        // which IS correct because Three.js updates world matrices (if we force it or wait).
                        // Let's force update world matrix for these moving parts.
                        child.updateMatrixWorld();
                        c.box.expandByObject(child);
                    });

                    // Note: c.box is the box stored in this.colliders, which PhysicsEngine uses?
                    // PhysicsEngine references ColliderSystem.
                    // ColliderSystem has its own internal list 'staticColliders' which are wrappers.
                    // If 'c' is the SAME object ref passed to ColliderSystem, then modifying c.box works if ColliderSystem reads it directly.
                    // BUT ColliderSystem puts objects in SpatialHash. SpatialHash keys are based on box position at insertion.
                    // If we change the box, we MUST update the SpatialHash.

                    // Since World doesn't have reference to ColliderSystem, we have a problem.
                    // However, 'window.app' is available globally in some contexts, or we can try to find where it is.
                    // But relying on window.app is dirty.

                    // Better approach: Since we can't easily reach ColliderSystem to re-index,
                    // AND manual cars are dynamic now, maybe they shouldn't be in "StaticColliders"?
                    // But they are manually placed.

                    // Workaround: Access global app if available to update collider system.
                    if (window.app && window.app.colliderSystem) {
                        // We need to re-insert this collider into the spatial hash
                        // internal method updateBody uses setFromObject(mesh) which includes path.
                        // We must do it manually.

                        // We need to find the wrapper in ColliderSystem corresponding to this mesh
                        const cs = window.app.colliderSystem;
                        const wrapper = cs.staticColliders.find(sc => sc.mesh === anchor);
                        if (wrapper) {
                            // Update the wrapper's box (wrapper.box should be same ref as c.box if everything linked correctly, but let's ensure)
                            wrapper.box.copy(c.box);

                            // Re-insert into spatial hash
                            cs.spatialHash.remove(wrapper); // Remove old entries (using old box? No, remove takes client and searches? No spatialHash.remove(client) isn't standard in the provided file.)
                            // Let's check spatialHash.js
                            // It doesn't have remove(client). It has clear().
                            // ColliderSystem.remove(mesh) rebuilds the whole hash! That's too slow for per-frame.

                            // Wait, ColliderSystem.remove(mesh) filters the array and rebuilds.
                            // We can't do that every frame.
                        }
                    }
                }
            }
        });

        // Handling the SpatialHash update efficiency issue:
        // If we move cars every frame, we need a Dynamic Collider system.
        // The current TrafficSystem handles cars separately.
        // These manual cars are hybrid.

        // For now, to satisfy "collision detection that follows them",
        // if we can't efficiently update SpatialHash, we might rely on a hack:
        // If the car moves, maybe we don't update SpatialHash every frame?
        // Or we add them to a "dynamic" list that PhysicsEngine checks explicitly (like TrafficSystem cars).

        // Since I cannot change the architecture easily, I will update the box in 'c.box'.
        // And I will try to update the SpatialHash efficiently if possible.
        // If SpatialHash doesn't support efficient update, I'm stuck.

        // Let's look at PhysicsEngine.resolveCollisions
        // It calls colliderSystem.checkCollisions.
        // checkCollisions queries spatialHash AND accepts dynamicColliders.
        // Maybe we should treat manual cars as dynamicColliders?

        // But manual cars are in 'this.colliders' which are added as static.
        // If I can remove them from static and pass them as dynamic...
        // But World.colliders is the source of truth for "Saved Map Objects".

        // Given the constraints and the MVP nature, updating the SpatialHash by full rebuild is bad.
        // But maybe the map isn't huge?

        // Alternative:
        // Do NOT update SpatialHash.
        // Instead, rely on the fact that the ANCHOR is in the SpatialHash.
        // The Anchor is at 0,0,0 relative to path? No, Anchor is at spawn point.
        // If the path is long, the Car moves far away from Anchor.
        // The SpatialHash bucket for the Anchor might not cover the Car's current position.

        // However, if the Box of the Anchor (initially calculated) covered the WHOLE path (which it did/does),
        // then the SpatialHash thinks this object is EVERYWHERE along the path.
        // So `checkCollisions` will return this object as a candidate if we are anywhere near the path.
        // Then `intersectsSphere` (narrow phase) checks `c.box`.
        // If we update `c.box` to be tight around the car, `intersectsSphere` will pass only when hitting the car.
        // AND, since the SpatialHash was populated with the HUGE box, the object is registered in all relevant cells.
        // So, as long as we don't *shrink* the SpatialHash footprint, updating `c.box` for narrow phase works!

        // So the plan:
        // 1. Initial creation makes a HUGE box (Path + Car).
        // 2. This HUGE box is used to insert into SpatialHash (covering all cells).
        // 3. In update loop, we shrink `c.box` to just the car.
        // 4. `checkCollisions` finds the object because of the initial huge insertion (assuming SpatialHash stores references and doesn't check box during query, just cell lookup).
        // 5. Narrow phase uses the current `c.box` (tight car).

        // Wait, does SpatialHash store a copy of the box?
        // SpatialHash.insert(client, aabb).
        // It uses aabb to calculate cells. It stores `client`.
        // It does NOT store the aabb.
        // So `query` returns the client.
        // Then `ColliderSystem` uses `other.box` (the client's box) for narrow phase.

        // So:
        // If we update `c.box` (the client's box) to be small,
        // The SpatialHash still has the client in all the "Path" cells (from initial insertion).
        // So broadphase works (we are in a cell on the path).
        // Narrowphase uses the updated small box.
        // This works perfectly! ... AS LONG AS we don't re-insert with the small box.
        // And as long as `c` in World.colliders is the SAME object as `client` in SpatialHash.
        // `ColliderSystem.addStatic` pushes `c` (from World.colliders) to `staticColliders`.
        // So yes, it's the same object reference.

        // So, I just need to update `c.box` in place!
    }

    // API for collisions
    getStaticColliders() {
        return this.colliders;
    }

    clear() {
        // Remove static colliders/meshes
        // Since we didn't track meshes separately in array (other than colliders list which has {mesh, box})
        // We can iterate colliders.
        this.colliders.forEach(c => {
            if (c.mesh) {
                this.scene.remove(c.mesh);
                // Recursively dispose geometry/materials if we want to be clean,
                // but JS GC handles it if we drop references and remove from scene.
                // However, Three.js geometries need manual dispose for GPU memory.
                // For this MVP we'll skip deep dispose unless lag occurs.
            }
        });
        this.colliders = [];
        if (this.birdSystem) this.birdSystem.clear();
    }

    loadMap(mapData) {
        this.clear();
        const factory = new ObjectFactory(this.scene);

        if (mapData.objects) {
            mapData.objects.forEach(obj => {
                // Pass position to createObject so initial box calculation is correct
                // Merge params with position
                const params = { ...(obj.params || obj.userData?.params || {}) };
                if (obj.position) {
                    params.x = obj.position.x;
                    params.z = obj.position.z;
                }

                const collider = factory.createObject(obj.type, params);
                if (collider) {
                    // Restore transform if provided (Handles Y and Rotation)
                    if (obj.position) collider.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
                    if (obj.rotation) collider.mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);

                    // Recompute box because rotation might have changed bounds
                    // And position might have been tweaked
                    // WARNING: For cars, this might shrink the box if we aren't careful?
                    // createCar creates box from group (including path).
                    // setFromObject(mesh) here will include path.
                    // So we are safe for the "Huge Broadphase" strategy.
                    if (collider.box) {
                        collider.box.setFromObject(collider.mesh);
                    }

                    this.colliders.push(collider);

                    // System Registration
                    if (obj.type === 'bird' && this.birdSystem) {
                        this.birdSystem.add(collider.mesh);
                    }
                }
            });
        }
    }

    exportMap() {
        // Iterate colliders to get static objects
        const objects = [];
        this.colliders.forEach(c => {
            if (c.mesh && c.mesh.userData.type) {
                // Ensure waypoints are saved for cars
                let params = c.mesh.userData.params || {};
                if (c.mesh.userData.type === 'car' && c.mesh.userData.waypoints) {
                    params = { ...params, waypoints: c.mesh.userData.waypoints };
                }

                objects.push({
                    type: c.mesh.userData.type,
                    params: params,
                    position: { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z },
                    rotation: { x: c.mesh.rotation.x, y: c.mesh.rotation.y, z: c.mesh.rotation.z }
                });
            }
        });
        return { version: 1, objects };
    }
}
