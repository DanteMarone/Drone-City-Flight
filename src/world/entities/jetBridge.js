import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class JetBridgeEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'jetBridge';
        this.timer = 0;
        this.beacon = null;
        this.cable = null;
    }

    static get displayName() { return 'Jet Bridge'; }

    createMesh(params) {
        const group = new THREE.Group();

        const length = params.length ?? 12 + Math.random() * 4;
        const extensionLength = params.extensionLength ?? 3 + Math.random() * 1.5;
        const legHeight = params.legHeight ?? 1.1 + Math.random() * 0.4;
        const cabinHeight = params.cabinHeight ?? 2.4 + Math.random() * 0.2;
        const offsetYaw = params.yawOffset ?? (Math.random() - 0.5) * 0.15;

        const cabinY = legHeight + cabinHeight / 2;
        const bodyColor = new THREE.Color().setHSL(0.58 + Math.random() * 0.05, 0.18, 0.72);
        const accentColor = new THREE.Color().setHSL(0.53 + Math.random() * 0.06, 0.6, 0.6);

        const cabinMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.55,
            metalness: 0.15
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x9aa4ae,
            roughness: 0.4,
            metalness: 0.4
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8ec8ff,
            emissive: new THREE.Color(0x1c6fa8),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.55,
            roughness: 0.08,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        const rubberMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.85,
            metalness: 0.05
        });

        const beaconMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.1
        });

        // Cabin Body
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(length, cabinHeight, 2.8), cabinMat);
        cabin.position.set(length / 2, cabinY, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        // Windows on both sides
        const windowGeo = new THREE.PlaneGeometry(length * 0.9, cabinHeight * 0.55);

        const leftWindow = new THREE.Mesh(windowGeo, glassMat);
        leftWindow.position.set(length / 2, cabinY, -1.41);
        leftWindow.rotation.y = Math.PI;
        group.add(leftWindow);

        const rightWindow = new THREE.Mesh(windowGeo, glassMat.clone());
        rightWindow.position.set(length / 2, cabinY, 1.41);
        group.add(rightWindow);

        // Frame bands for segmented feel
        const segmentCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i <= segmentCount; i++) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, cabinHeight * 0.95, 2.9), frameMat);
            frame.position.set((length / segmentCount) * i, cabinY, 0);
            frame.castShadow = true;
            group.add(frame);
        }

        // Roof greebles (small HVAC bumps)
        const bumpGeo = new THREE.BoxGeometry(1, 0.35, 1.1);
        for (let i = 0; i < 3; i++) {
            const bump = new THREE.Mesh(bumpGeo, frameMat);
            bump.position.set(length * (0.25 + 0.25 * i), cabinY + cabinHeight / 2 + 0.2, 0);
            bump.castShadow = true;
            group.add(bump);
        }

        // Support column and wheels
        const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 18), frameMat);
        basePlate.position.y = 0.125;
        basePlate.receiveShadow = true;
        group.add(basePlate);

        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, legHeight, 16), frameMat);
        column.position.y = legHeight / 2 + 0.25;
        column.castShadow = true;
        group.add(column);

        const wheelGeo = new THREE.TorusGeometry(0.42, 0.08, 10, 18);
        [-0.9, 0.9].forEach(z => {
            const wheel = new THREE.Mesh(wheelGeo, rubberMat);
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(0.5, 0.45, z);
            wheel.castShadow = true;
            group.add(wheel);
        });

        // Extension nose toward aircraft
        const noseGeo = new THREE.CylinderGeometry(1.35, 1.55, extensionLength, 20, 1, true);
        noseGeo.rotateZ(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, cabinMat);
        nose.position.set(length + extensionLength / 2, cabinY, 0);
        nose.castShadow = true;
        nose.receiveShadow = true;
        group.add(nose);

        const seal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 16, 1, false), rubberMat);
        seal.geometry.rotateZ(Math.PI / 2);
        seal.position.set(length + extensionLength + 0.2, cabinY, 0);
        seal.castShadow = true;
        group.add(seal);

        // Beacon at the end
        this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), beaconMat);
        this.beacon.position.set(length + extensionLength + 0.55, cabinY + cabinHeight / 2 + 0.15, 0);
        this.beacon.castShadow = true;
        group.add(this.beacon);

        // Flexible service cable with slight sway
        const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, legHeight + 0.6, 8);
        cableGeo.translate(0, -(legHeight + 0.6) / 2, 0);
        this.cable = new THREE.Mesh(cableGeo, rubberMat);
        this.cable.position.set(length * 0.7, cabinY, -1.05);
        this.cable.castShadow = true;
        group.add(this.cable);

        // Handrail along the roof edge
        const railGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 10);
        railGeo.rotateZ(Math.PI / 2);
        const rail = new THREE.Mesh(railGeo, frameMat);
        rail.position.set(length / 2, cabinY + cabinHeight / 2 + 0.45, 1.45);
        rail.castShadow = true;
        group.add(rail);

        group.rotation.y = offsetYaw;

        return group;
    }

    update(dt) {
        this.timer += dt;

        if (this.beacon) {
            const pulse = 0.5 + 0.5 * Math.sin(this.timer * 3.2);
            this.beacon.material.emissiveIntensity = 0.6 + pulse * 1.1;
            this.beacon.scale.setScalar(0.95 + pulse * 0.08);
        }

        if (this.cable) {
            this.cable.rotation.z = Math.sin(this.timer * 1.6) * 0.07;
        }
    }
}

EntityRegistry.register('jetBridge', JetBridgeEntity);
