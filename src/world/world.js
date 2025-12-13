// src/world/world.js
import * as THREE from 'three';
import { DistrictGenerator } from './generation.js';
import { ObjectFactory } from './factory.js';
import { BirdSystem } from './birdSystem.js';

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
                    anchor.userData.movingForward = true;
                }

                let targetIdx = anchor.userData.targetIndex;

                // Safety clamp
                if (targetIdx < 0) targetIdx = 0;
                if (targetIdx >= path.length) targetIdx = path.length - 1;

                const targetPos = path[targetIdx];
                const currentPos = modelChildren[0].position.clone();

                const speed = 15; // Speed adjustment
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

                    // Update Logic (Ping Pong)
                    if (anchor.userData.movingForward) {
                        if (targetIdx < path.length - 1) {
                            anchor.userData.targetIndex++;
                        } else {
                            // Reached End -> Switch Direction
                            anchor.userData.movingForward = false;
                            anchor.userData.targetIndex--;
                        }
                    } else {
                        if (targetIdx > 0) {
                            anchor.userData.targetIndex--;
                        } else {
                            // Reached Start -> Switch Direction
                            anchor.userData.movingForward = true;
                            anchor.userData.targetIndex++;
                        }
                    }
                }
            }
        });
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
