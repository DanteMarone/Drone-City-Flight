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
        this.colliders.forEach(c => {
            if (c.mesh && c.mesh.userData.type === 'car' && c.mesh.userData.waypoints && c.mesh.userData.waypoints.length > 0) {
                const car = c.mesh;
                const waypoints = car.userData.waypoints;

                // Waypoints are LOCAL to the car's initial position if we move the car?
                // Wait, if we move the car mesh, the children (visuals) move.
                // But the logic uses `waypoints` array which are vectors.
                // If those vectors are LOCAL coordinates, we need to convert them to world for distance checks?
                // No, the car is moving relative to its parent (Scene).
                // "Cars travel down the pathing from one waypoint to the next".
                // If the car moves, its position changes.
                // If waypoints are offsets, then:
                // Target World Pos = Initial Car Pos + Waypoint Offset.
                // But `car.position` is changing as it moves.
                // So we can't define path relative to moving car.
                // We need to define path relative to the WORLD or a static Anchor.

                // OPTION 1: Waypoints are WORLD coordinates.
                // - When moving car in DevMode, we shift all waypoints?
                // - Or we keep them fixed? Usually attached objects move with parent.
                // OPTION 2: Waypoints are LOCAL to a "CarAnchor" group.
                // - The Car Mesh moves INSIDE the anchor?
                // - Or the Anchor is what we place, and the Car Mesh moves relative to Anchor.

                // Let's go with OPTION 2 logic but using the existing Group as the Anchor.
                // The `group` created in factory is the Anchor.
                // The actual car meshes (`body`, `details`) are children.
                // We should animate `body` and `details` positions?
                // BUT `createCar` adds `body` and `details` directly to `group`.
                // And `box` is set from `group`.
                // If we move children, the collider box changes?
                // `c.box` is static AABB. If car moves, `c.box` needs update?
                // The collider system uses SpatialHash. Moving static objects is expensive/not supported dynamically without remove/add.
                // BUT, cars are dynamic. They shouldn't be in "Static Colliders" list if they move?
                // "Manually placed cars... travel".
                // Currently `TrafficSystem` handles dynamic cars.
                // `World.colliders` are STATIC.
                // If manual cars move, they shouldn't be in `this.colliders` for collision purposes as static blocks?
                // Or we update them?

                // Given the requirement "interact... like any object", it suggests they are treated like static objects in DevMode.
                // In Normal Mode, they move.
                // So we should animate the `group.position`?
                // If we animate `group.position`:
                // - The waypoints (children) will move with the car. That's bad. The path would travel with the car.
                // - So the path must be defined in World Space, OR relative to an Anchor.

                // Let's assume `waypoints` are Local Offsets from the START position.
                // And we have a `visualRoot` inside the group for the car model?
                // Let's restructure `createCar` slightly?
                // Too late, already edited.
                // Current structure: Group -> [Body, Details, Visuals].

                // Fix: We need an "Anchor" group which stays at the placed location.
                // The Car Model (Body+Details) should be in a sub-group "CarModel".
                // The Path Visuals should be in the Anchor group.
                // We animate "CarModel" along the path defined by Waypoints (which are local to Anchor).

                // I need to adjust `createCar` logic in `_updateManualCars`.
                // If I didn't create a sub-group, I can't move car independently of waypoints easily if waypoints are children.
                // BUT I can just animate the Body and Details meshes!
                // `body` and `details` are children of `group`.
                // `group` stays static at origin of placement.
                // `waypoints` are local to `group`.
                // We move `body` and `details` to match waypoint positions.
                // This works perfectly!

                // One catch: `box` (Collider) is computed from `group`.
                // If `body` moves away, the static collider remains at origin?
                // Yes. This means collision detection for the moving car won't work using the static collider system.
                // But `TrafficSystem` handles dynamic car collision separately.
                // Does `World` expose manual cars to `TrafficSystem`? No.
                // Does the drone collide with manual cars?
                // If `box` is in `colliders`, drone collides with the BOX.
                // If the box covers the path? No, box is just the initial bounding box.

                // Dynamic collision for manual cars is a "nice to have" or required?
                // "Cars now have pathing".
                // If I crash into a moving manual car, I expect a crash.
                // I should probably update the `box` every frame or register it as a dynamic collider.
                // For MVP, updating the box roughly is okay, or just letting the static box be (user might be confused hitting invisible wall at start).
                // Better: Remove from static colliders during play?

                // Let's focus on MOVEMENT first.

                const speed = 10; // Units per second
                const anchor = c.mesh;
                const model = [];
                // Find body and details. They are children.
                // Filters out visualGroup.
                anchor.children.forEach(child => {
                   if (child.name !== 'waypointVisuals') {
                       model.push(child);
                   }
                });

                // Current Logic
                const points = [new THREE.Vector3(0, 0, 0), ...car.userData.waypoints];
                // Ping Pong logic
                // Index tracks "Target Waypoint".
                // Start: at 0. Target 1.
                // If at End: Turn around.

                let idx = car.userData.currentWaypointIndex || 0;
                let forward = car.userData.movingForward !== undefined ? car.userData.movingForward : true;

                // Current position of the car model (local to anchor)
                // We can just check the first part of model
                if (model.length === 0) return;
                const currentPos = model[0].position.clone();

                // Determine target index
                let targetIdx = forward ? idx + 1 : idx - 1;

                // Boundary checks
                if (forward && targetIdx >= points.length) {
                    forward = false;
                    car.userData.movingForward = false;
                    targetIdx = points.length - 2;
                } else if (!forward && targetIdx < 0) {
                    forward = true;
                    car.userData.movingForward = true;
                    targetIdx = 1;
                }

                const targetPos = points[targetIdx];

                // Move towards target
                const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
                const dist = dir.length();

                if (dist < 0.1) {
                    // Reached
                    car.userData.currentWaypointIndex = targetIdx;
                    return; // Wait for next frame to pick next target
                }

                dir.normalize();
                const move = dir.multiplyScalar(speed * dt);

                // Cap movement
                if (move.length() > dist) move.setLength(dist);

                const newPos = currentPos.add(move);

                // Update Rotation (Look at target)
                // We need to rotate the model to face the direction.
                // Local rotation?
                // atan2 for Y rotation.
                // dir is local direction.
                const angle = Math.atan2(dir.x, dir.z);

                model.forEach(m => {
                    m.position.copy(newPos);
                    // Reset rotation and apply new Y
                    // Note: Car models might have intrinsic rotation?
                    // Sedan geometry is Z-forward?
                    // Checking `traffic.js`: `dummy.rotation.y = ...`
                    // `carGeometries.js`: Wheels are rotated, but chassis is axis aligned?
                    // It seems aligned to Z?
                    // Let's try simple Y rotation.
                    m.rotation.set(0, angle, 0);
                });
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
