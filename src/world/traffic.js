// src/world/traffic.js
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class TrafficSystem {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.carTypes = []; // { bodyMesh, detailMesh, config }

        this.totalCars = 150;

        this._initCarTypes();
        this._spawnCars();
    }

    _initCarTypes() {
        // Shared Materials
        const bodyMat = new THREE.MeshStandardMaterial({
            roughness: 0.2,
            metalness: 0.6
        }); // Color will be set per instance

        const detailMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });

        // --- Type 1: Sedan ---
        const sedanGeo = this._createSedanGeometry();
        const sedanBodyMesh = new THREE.InstancedMesh(sedanGeo.body, bodyMat, this.totalCars);
        const sedanDetailMesh = new THREE.InstancedMesh(sedanGeo.details, detailMat, this.totalCars);

        sedanBodyMesh.castShadow = true;
        sedanBodyMesh.receiveShadow = true;
        sedanDetailMesh.castShadow = true;

        this.scene.add(sedanBodyMesh);
        this.scene.add(sedanDetailMesh);

        this.carTypes.push({
            name: 'sedan',
            bodyMesh: sedanBodyMesh,
            detailMesh: sedanDetailMesh,
            speedRange: [10, 18],
            offsetY: 0
        });

        // --- Type 2: SUV ---
        const suvGeo = this._createSUVGeometry();
        const suvBodyMesh = new THREE.InstancedMesh(suvGeo.body, bodyMat, this.totalCars);
        const suvDetailMesh = new THREE.InstancedMesh(suvGeo.details, detailMat, this.totalCars);

        suvBodyMesh.castShadow = true;
        suvBodyMesh.receiveShadow = true;
        suvDetailMesh.castShadow = true;

        this.scene.add(suvBodyMesh);
        this.scene.add(suvDetailMesh);

        this.carTypes.push({
            name: 'suv',
            bodyMesh: suvBodyMesh,
            detailMesh: suvDetailMesh,
            speedRange: [8, 15],
            offsetY: 0
        });
    }

    _createSedanGeometry() {
        const bodyParts = [];
        const detailParts = [];

        // Chassis
        const chassis = new THREE.BoxGeometry(1.8, 0.5, 4.2);
        chassis.translate(0, 0.5, 0);
        bodyParts.push(chassis);

        // Cabin
        const cabin = new THREE.BoxGeometry(1.6, 0.6, 2.2);
        cabin.translate(0, 1.0, -0.2); // Shifted back slightly
        bodyParts.push(cabin);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wX = 0.8, wY = 0.35, wZ = 1.3;

        const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
        const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
        const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
        const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

        // Bumpers / Grill
        const bumper = new THREE.BoxGeometry(1.8, 0.3, 0.2);
        const frontB = bumper.clone(); frontB.translate(0, 0.4, 2.15); detailParts.push(frontB);
        const backB = bumper.clone(); backB.translate(0, 0.4, -2.15); detailParts.push(backB);

        // Windows (Simple inset dark boxes)
        // Windshield
        const windshield = new THREE.BoxGeometry(1.5, 0.5, 0.1);
        windshield.rotateX(-Math.PI / 6);
        windshield.translate(0, 1.05, 0.95);
        detailParts.push(windshield);

        return {
            body: mergeGeometries(bodyParts),
            details: mergeGeometries(detailParts)
        };
    }

    _createSUVGeometry() {
        const bodyParts = [];
        const detailParts = [];

        // Chassis (Boxier)
        const chassis = new THREE.BoxGeometry(2.0, 0.7, 4.6);
        chassis.translate(0, 0.75, 0); // Higher ground clearance
        bodyParts.push(chassis);

        // Cabin (Full length almost)
        const cabin = new THREE.BoxGeometry(1.9, 0.8, 3.5);
        cabin.translate(0, 1.5, -0.2);
        bodyParts.push(cabin);

        // Wheels (Bigger)
        const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wX = 0.9, wY = 0.45, wZ = 1.5;

        const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
        const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
        const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
        const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

        // Windows
        const sideWin = new THREE.BoxGeometry(1.95, 0.6, 3.0);
        sideWin.translate(0, 1.5, -0.2);
        detailParts.push(sideWin);

        return {
            body: mergeGeometries(bodyParts),
            details: mergeGeometries(detailParts)
        };
    }

    _spawnCars() {
        const dummy = new THREE.Object3D();
        const range = 400; // World bounds

        // Reset all instance counts (we might not use all if we split them)
        // Actually, we need to manage indices carefully.
        // We'll iterate through `totalCars` and assign them to types randomly.

        let typeIndices = this.carTypes.map(() => 0); // Counter for each type

        for (let i = 0; i < this.totalCars; i++) {
            // Pick a type
            const typeIdx = Math.random() > 0.7 ? 1 : 0; // 30% SUVs
            const type = this.carTypes[typeIdx];
            const idx = typeIndices[typeIdx]++;

            // Logic from original: Pick axis and lane
            // Snap to approximate lane based on simplified grid
            // Downtown: ~36m spacing. Commercial: ~45m. Suburbs: ~28m.
            // We just pick random valid "Lanes"
            const laneTypes = [36, 45, 28];
            const spacing = laneTypes[Math.floor(Math.random() * laneTypes.length)];

            const laneIndex = Math.floor((Math.random() - 0.5) * 20);
            const blockCenter = laneIndex * spacing;
            const roadCenter = blockCenter + spacing / 2;
            const laneOffset = (Math.random() > 0.5 ? 3.5 : -3.5); // Wider lanes
            const lanePos = roadCenter + laneOffset;

            const axis = Math.random() > 0.5 ? 'x' : 'z';
            const dir = Math.random() > 0.5 ? 1 : -1;
            const pos = new THREE.Vector3();

            if (axis === 'x') {
                pos.set((Math.random() - 0.5) * range * 2, 0, lanePos);
            } else {
                pos.set(lanePos, 0, (Math.random() - 0.5) * range * 2);
            }

            // Speed
            const speed = type.speedRange[0] + Math.random() * (type.speedRange[1] - type.speedRange[0]);

            // Color
            const color = this._getRandomCarColor();

            // Store State
            this.cars.push({
                typeIdx,
                instanceIdx: idx,
                position: pos,
                axis,
                direction: dir,
                speed,
                rotation: axis === 'x' ? (dir > 0 ? Math.PI/2 : -Math.PI/2) : (dir > 0 ? 0 : Math.PI)
            });

            // Set Initial Transform
            dummy.position.copy(pos);
            dummy.rotation.y = axis === 'x' ? (dir > 0 ? Math.PI/2 : -Math.PI/2) : (dir > 0 ? 0 : Math.PI);
            dummy.updateMatrix();

            type.bodyMesh.setMatrixAt(idx, dummy.matrix);
            type.bodyMesh.setColorAt(idx, color);
            type.detailMesh.setMatrixAt(idx, dummy.matrix);
        }

        // Update all meshes
        this.carTypes.forEach(t => {
            t.bodyMesh.instanceMatrix.needsUpdate = true;
            t.bodyMesh.instanceColor.needsUpdate = true;
            t.detailMesh.instanceMatrix.needsUpdate = true;
            // Hide unused instances
            // We instantiated `totalCars` for EACH type, but only used some.
            // Move unused to infinity.
            const used = typeIndices[this.carTypes.indexOf(t)];
            for (let j = used; j < this.totalCars; j++) {
                dummy.position.set(0, -100, 0);
                dummy.updateMatrix();
                t.bodyMesh.setMatrixAt(j, dummy.matrix);
                t.detailMesh.setMatrixAt(j, dummy.matrix);
            }
        });
    }

    _getRandomCarColor() {
        // Realistic car colors
        const colors = [
            0xffffff, // White
            0x000000, // Black
            0xaaaaaa, // Silver
            0x555555, // Grey
            0x880000, // Dark Red
            0x000088, // Dark Blue
            0xffeeaa, // Champagne
            0x224422  // Dark Green
        ];
        return new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    }

    update(dt) {
        const range = 500;
        const dummy = new THREE.Object3D();

        this.cars.forEach(car => {
            // Move
            if (car.axis === 'x') {
                car.position.x += car.direction * car.speed * dt;
                if (car.position.x > range) car.position.x = -range;
                if (car.position.x < -range) car.position.x = range;
            } else {
                car.position.z += car.direction * car.speed * dt;
                if (car.position.z > range) car.position.z = -range;
                if (car.position.z < -range) car.position.z = range;
            }

            // Update Instance
            dummy.position.copy(car.position);
            dummy.rotation.y = car.rotation;
            dummy.updateMatrix();

            const type = this.carTypes[car.typeIdx];
            type.bodyMesh.setMatrixAt(car.instanceIdx, dummy.matrix);
            type.detailMesh.setMatrixAt(car.instanceIdx, dummy.matrix);
        });

        this.carTypes.forEach(t => {
            t.bodyMesh.instanceMatrix.needsUpdate = true;
            t.detailMesh.instanceMatrix.needsUpdate = true;
        });
    }

    getNearbyCarColliders(dronePos, radius) {
        const colliders = [];
        const r2 = radius + 5;

        // Optimization: Checking 150 items is fast enough
        for (const car of this.cars) {
            const dx = Math.abs(car.position.x - dronePos.x);
            const dz = Math.abs(car.position.z - dronePos.z);

            if (dx < r2 && dz < r2) {
                // Approximate box for collision
                const type = this.carTypes[car.typeIdx];
                const isSUV = type.name === 'suv';
                const size = isSUV ? new THREE.Vector3(2.0, 1.8, 4.6) : new THREE.Vector3(1.8, 1.4, 4.2);

                // Rotate dimensions
                const boxSize = car.axis === 'x'
                    ? new THREE.Vector3(size.z, size.y, size.x)
                    : size;

                // Center adjustment (Cars origin is at bottom center, Box3 is from center)
                // Position is at y=0.
                const center = car.position.clone();
                center.y += size.y / 2;

                const box = new THREE.Box3().setFromCenterAndSize(center, boxSize);

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
