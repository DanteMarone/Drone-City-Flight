// src/world/traffic.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class TrafficSystem {
    constructor(scene, colliderSystem) {
        this.scene = scene;
        this.colliderSystem = colliderSystem;
        this.cars = [];
        this.instanceMesh = null;
        this.count = 100; // Max cars
        this.dummy = new THREE.Object3D();

        // Car Dimensions
        this.carSize = { x: 2.0, y: 1.2, z: 4.5 }; // Width, Height, Length

        this._initMesh();
        this._spawnCars();
    }

    _initMesh() {
        const geo = new THREE.BoxGeometry(this.carSize.x, this.carSize.y, this.carSize.z);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3 });

        this.instanceMesh = new THREE.InstancedMesh(geo, mat, this.count);
        this.instanceMesh.castShadow = true;
        this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instanceMesh);
    }

    _spawnCars() {
        // Spawn logic: Place on grid lines defined in Generation
        // Downtown/Commercial/Suburb grids.
        // Simplified: Assuming grid lines at intervals of ~30-40m
        // We'll spawn random cars on X and Z axis lines.

        const range = 400; // World bounds

        for (let i = 0; i < this.count; i++) {
            // Pick axis: 0 = X-axis (move along X), 1 = Z-axis
            const axis = Math.random() > 0.5 ? 'x' : 'z';

            // Snap to approximate lane
            // Grid spacing approx 34m (24 block + 10 street)
            // We blindly pick a lane coordinate
            const laneStep = 34;
            const laneIndex = Math.floor((Math.random() - 0.5) * (range / laneStep) * 2);
            const lanePos = laneIndex * laneStep + (Math.random() > 0.5 ? 5 : -5); // Offset for two-way traffic?

            const pos = new THREE.Vector3();
            const dir = Math.random() > 0.5 ? 1 : -1;

            if (axis === 'x') {
                pos.set((Math.random() - 0.5) * range * 2, 0.6, lanePos);
            } else {
                pos.set(lanePos, 0.6, (Math.random() - 0.5) * range * 2);
            }

            this.cars.push({
                position: pos,
                axis: axis,
                direction: dir,
                speed: 8 + Math.random() * 5, // m/s
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
            });

            // Set initial color
            this.instanceMesh.setColorAt(i, this.cars[i].color);
        }
        this.instanceMesh.instanceColor.needsUpdate = true;
    }

    update(dt) {
        const range = 500; // Wrap limit

        for (let i = 0; i < this.count; i++) {
            const car = this.cars[i];

            // Move
            if (car.axis === 'x') {
                car.position.x += car.direction * car.speed * dt;
                // Wrap
                if (car.position.x > range) car.position.x = -range;
                if (car.position.x < -range) car.position.x = range;

                // Rotation
                this.dummy.rotation.y = car.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
            } else {
                car.position.z += car.direction * car.speed * dt;
                // Wrap
                if (car.position.z > range) car.position.z = -range;
                if (car.position.z < -range) car.position.z = range;

                // Rotation
                this.dummy.rotation.y = car.direction > 0 ? 0 : Math.PI;
            }

            this.dummy.position.copy(car.position);
            this.dummy.updateMatrix();
            this.instanceMesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.instanceMesh.instanceMatrix.needsUpdate = true;

        // Update Colliders?
        // Updating spatial hash for 100 moving objects every frame is expensive in JS?
        // Maybe only check near drone.
        // For MVP, we pass the active cars to collider system OR let collider system poll traffic.
        // Let's have a method `getColliders(dronePos, radius)` that returns AABBs of nearby cars.
    }

    getNearbyCarColliders(dronePos, radius) {
        // Linear scan for MVP (100 items is fast)
        // Optimization: Spatial grid for cars
        const colliders = [];
        const r2 = radius + 5; // Search radius

        for (let i = 0; i < this.count; i++) {
            const car = this.cars[i];
            const dx = Math.abs(car.position.x - dronePos.x);
            const dz = Math.abs(car.position.z - dronePos.z);

            if (dx < r2 && dz < r2) {
                // Create AABB
                const box = new THREE.Box3();
                const halfSize = new THREE.Vector3(this.carSize.x/2, this.carSize.y/2, this.carSize.z/2);

                // Rotate box dimensions based on axis?
                // AABB is axis aligned. If car is rotated 90deg, x/z swap.
                let size = halfSize.clone();
                if (car.axis === 'x') {
                    // Car local Z is length. Rotated 90deg, Length is along World X.
                    size.set(this.carSize.z/2, this.carSize.y/2, this.carSize.x/2);
                }

                box.setFromCenterAndSize(car.position, size.multiplyScalar(2));

                colliders.push({
                    type: 'car',
                    box: box,
                    velocity: new THREE.Vector3(
                        car.axis === 'x' ? car.direction * car.speed : 0,
                        0,
                        car.axis === 'z' ? car.direction * car.speed : 0
                    )
                });
            }
        }
        return colliders;
    }
}
