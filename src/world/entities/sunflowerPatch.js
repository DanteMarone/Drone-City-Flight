import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SunflowerPatchEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sunflowerPatch';
        this.sunflowerSway = [];
    }

    static get displayName() { return 'Sunflower Patch'; }

    createMesh(params) {
        const group = new THREE.Group();

        const patchRadius = params.radius || 0.9 + Math.random() * 0.4;
        const patchHeight = params.height || 0.25 + Math.random() * 0.1;
        const rimHeight = patchHeight * 0.25;

        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2a1a, roughness: 0.95, metalness: 0 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x7b4a2b, roughness: 0.8, metalness: 0.05 });
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 0.7, metalness: 0 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4da83d, roughness: 0.6, metalness: 0 });
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xf7c948, roughness: 0.55, metalness: 0.05 });
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x8f5a2b, roughness: 0.6, metalness: 0.1 });

        const soil = new THREE.Mesh(
            new THREE.CylinderGeometry(patchRadius, patchRadius * 0.92, patchHeight, 18),
            soilMat
        );
        soil.position.y = patchHeight / 2;
        soil.receiveShadow = true;
        group.add(soil);

        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(patchRadius * 1.03, patchRadius * 1.03, rimHeight, 18, 1, true),
            rimMat
        );
        rim.position.y = patchHeight + rimHeight / 2 - 0.05;
        rim.castShadow = true;
        rim.receiveShadow = true;
        group.add(rim);

        const sunflowerCount = params.count || 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < sunflowerCount; i++) {
            const flowerGroup = new THREE.Group();

            const stemHeight = 0.65 + Math.random() * 0.35;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, stemHeight, 8), stemMat);
            stem.position.y = stemHeight / 2;
            stem.castShadow = true;
            stem.receiveShadow = true;
            flowerGroup.add(stem);

            const leafGeo = new THREE.ConeGeometry(0.14, 0.3, 7);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(0.12, stemHeight * 0.55, 0);
            leaf.rotation.z = Math.PI / 2.4;
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            flowerGroup.add(leaf);

            const leaf2 = leaf.clone();
            leaf2.position.set(-0.12, stemHeight * 0.7, 0.06);
            leaf2.rotation.z = -Math.PI / 2.5;
            flowerGroup.add(leaf2);

            const headPivot = new THREE.Group();
            headPivot.position.y = stemHeight + 0.05;
            flowerGroup.add(headPivot);

            const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.09, 16), centerMat);
            head.rotation.x = Math.PI / 2;
            head.castShadow = true;
            headPivot.add(head);

            const petalGeo = new THREE.ConeGeometry(0.05, 0.2, 6);
            for (let p = 0; p < 12; p++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                const angle = (p / 12) * Math.PI * 2;
                petal.position.set(Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0);
                petal.rotation.z = angle;
                petal.rotation.x = Math.PI / 2;
                petal.castShadow = true;
                headPivot.add(petal);
            }

            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetRadius = (patchRadius * 0.55) + Math.random() * (patchRadius * 0.25);
            flowerGroup.position.set(
                Math.cos(offsetAngle) * offsetRadius,
                patchHeight - 0.05,
                Math.sin(offsetAngle) * offsetRadius
            );
            flowerGroup.rotation.y = Math.random() * Math.PI * 2;

            const baseRotation = new THREE.Euler(
                -0.15 - Math.random() * 0.25,
                flowerGroup.rotation.y,
                0
            );
            headPivot.rotation.copy(baseRotation);

            this.sunflowerSway.push({
                pivot: headPivot,
                phase: Math.random() * Math.PI * 2,
                speed: 0.6 + Math.random() * 0.6,
                amplitude: 0.05 + Math.random() * 0.04,
                baseRotation
            });

            group.add(flowerGroup);
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.sunflowerSway.forEach((flower) => {
            flower.phase += dt * flower.speed;
            const sway = Math.sin(flower.phase) * flower.amplitude;
            flower.pivot.rotation.x = flower.baseRotation.x + sway;
            flower.pivot.rotation.z = flower.baseRotation.z + Math.cos(flower.phase) * flower.amplitude * 0.6;
            flower.pivot.rotation.y = flower.baseRotation.y;
        });
    }
}

EntityRegistry.register('sunflowerPatch', SunflowerPatchEntity);
