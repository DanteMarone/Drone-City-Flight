import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';

export class FireTruckEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'fireTruck';
        this.baseSpeed = 12.0; // Slower than a car, heavy vehicle

        // Light flash state
        this.flashTimer = 0;
        this.flashState = false;
    }

    static get displayName() { return 'Fire Truck'; }

    createMesh(params) {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        // Materials
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xd32f2f,
            roughness: 0.3,
            metalness: 0.4
        });
        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.4
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.2,
            metalness: 0.8
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const windowMat = new THREE.MeshStandardMaterial({
            color: 0x2196f3,
            roughness: 0.1,
            metalness: 0.9
        });

        // Emissive materials for lights (cloned for unique state)
        this.lightMatA = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x000000, roughness: 0.2 });
        this.lightMatB = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x000000, roughness: 0.2 });

        // --- Chassis ---
        // Main body (Tank/Storage)
        const chassisGeo = new THREE.BoxGeometry(2.4, 2.0, 6.0); // W, H, L
        chassisGeo.translate(0, 1.8, 0.5); // Lifted up for wheels, shifted back
        const chassis = new THREE.Mesh(chassisGeo, redMat);
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        modelGroup.add(chassis);

        // Cab
        const cabGeo = new THREE.BoxGeometry(2.4, 2.2, 2.0);
        cabGeo.translate(0, 1.9, -3.0); // Front of the truck
        const cab = new THREE.Mesh(cabGeo, redMat);
        cab.castShadow = true;
        cab.receiveShadow = true;
        modelGroup.add(cab);

        // Stripe (White stripe along the side)
        const stripeGeo = new THREE.BoxGeometry(2.45, 0.4, 8.0);
        stripeGeo.translate(0, 1.5, -0.5);
        const stripe = new THREE.Mesh(stripeGeo, whiteMat);
        modelGroup.add(stripe);

        // Windshield
        const windshieldGeo = new THREE.BoxGeometry(2.2, 1.0, 0.1);
        windshieldGeo.translate(0, 2.2, -4.01); // Slightly in front of cab
        const windshield = new THREE.Mesh(windshieldGeo, windowMat);
        modelGroup.add(windshield);

        // --- Wheels ---
        const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16);
        wheelGeo.rotateZ(Math.PI / 2);

        const wheelPositions = [
            // Front Axle
            { x: 1.2, z: -3.0 }, { x: -1.2, z: -3.0 },
            // Rear Axle 1
            { x: 1.2, z: 1.5 }, { x: -1.2, z: 1.5 },
            // Rear Axle 2
            { x: 1.2, z: 3.0 }, { x: -1.2, z: 3.0 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, tireMat);
            wheel.position.set(pos.x, 0.7, pos.z);
            wheel.castShadow = true;
            modelGroup.add(wheel);
        });

        // --- Ladder ---
        // Base of ladder
        const ladderBaseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        const ladderBase = new THREE.Mesh(ladderBaseGeo, chromeMat);
        ladderBase.position.set(0, 2.9, 0);
        modelGroup.add(ladderBase);

        // The Ladder itself (angled up)
        const ladderGroup = new THREE.Group();
        ladderGroup.position.set(0, 3.0, 0);
        ladderGroup.rotation.x = THREE.MathUtils.degToRad(-15); // Angled up

        // Rails
        const railGeo = new THREE.BoxGeometry(0.2, 0.2, 5.0);
        const leftRail = new THREE.Mesh(railGeo, chromeMat);
        leftRail.position.set(-0.4, 0, 1.5);
        const rightRail = new THREE.Mesh(railGeo, chromeMat);
        rightRail.position.set(0.4, 0, 1.5);

        ladderGroup.add(leftRail);
        ladderGroup.add(rightRail);

        // Rungs
        const rungGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        rungGeo.rotateZ(Math.PI / 2);
        for(let i = 0; i < 10; i++) {
            const rung = new THREE.Mesh(rungGeo, chromeMat);
            rung.position.set(0, 0, -0.8 + (i * 0.5));
            ladderGroup.add(rung);
        }

        modelGroup.add(ladderGroup);

        // --- Lights ---
        // Light bar on cab
        const lightBarGeo = new THREE.BoxGeometry(1.8, 0.2, 0.2);
        const lightBar = new THREE.Mesh(lightBarGeo, chromeMat);
        lightBar.position.set(0, 3.1, -3.2);
        modelGroup.add(lightBar);

        // Flashing Lights
        const lightGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);

        this.lightA = new THREE.Mesh(lightGeo, this.lightMatA); // Red
        this.lightA.position.set(-0.6, 3.25, -3.2);
        modelGroup.add(this.lightA);

        this.lightB = new THREE.Mesh(lightGeo, this.lightMatB); // White/Blue
        this.lightB.position.set(0.6, 3.25, -3.2);
        modelGroup.add(this.lightB);

        // Parent Group
        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }

    update(dt) {
        super.update(dt); // Handle movement

        // Flashing Light Logic
        this.flashTimer += dt;
        if (this.flashTimer > 0.5) { // Flash every 0.5s
            this.flashTimer = 0;
            this.flashState = !this.flashState;

            if (this.flashState) {
                this.lightMatA.emissive.setHex(0xff0000);
                this.lightMatA.emissiveIntensity = 2.0;

                this.lightMatB.color.setHex(0x222222); // Dim
                this.lightMatB.emissiveIntensity = 0;
            } else {
                this.lightMatA.color.setHex(0x550000); // Dim
                this.lightMatA.emissiveIntensity = 0;

                this.lightMatB.color.setHex(0xffffff);
                this.lightMatB.emissive.setHex(0xffffff);
                this.lightMatB.emissiveIntensity = 2.0;
            }
        }
    }
}

EntityRegistry.register('fireTruck', FireTruckEntity);
