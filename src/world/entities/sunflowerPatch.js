import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SunflowerPatchEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sunflowerPatch';
        this.time = Math.random() * Math.PI * 2;
        this.stems = [];
    }

    static get displayName() { return 'Sunflower Patch'; }

    createMesh(params) {
        const group = new THREE.Group();

        const soilRadius = params.radius || 0.9 + Math.random() * 0.4;
        const soilHeight = 0.12 + Math.random() * 0.05;
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2b1c, roughness: 1, metalness: 0 });
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(soilRadius, soilRadius * 0.92, soilHeight, 18), soilMat);
        soil.position.y = soilHeight / 2;
        soil.receiveShadow = true;
        group.add(soil);

        const rimMat = new THREE.MeshStandardMaterial({ color: 0x2c1d12, roughness: 0.9, metalness: 0 });
        const rim = new THREE.Mesh(new THREE.TorusGeometry(soilRadius * 0.9, soilRadius * 0.08, 10, 24), rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = soilHeight * 0.85;
        rim.receiveShadow = true;
        group.add(rim);

        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e6b2d, roughness: 0.8, metalness: 0 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f9d3a, roughness: 0.7, metalness: 0 });
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1f, roughness: 0.8, metalness: 0.05 });
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xf4c542, roughness: 0.6, metalness: 0.05 });

        const flowerCount = 5 + Math.floor(Math.random() * 4);
        const stemRadius = 0.035;
        const petalGeo = new THREE.ConeGeometry(0.09, 0.22, 6);
        const leafGeo = new THREE.ConeGeometry(0.12, 0.28, 6);

        for (let i = 0; i < flowerCount; i++) {
            const stemGroup = new THREE.Group();
            const stemHeight = 0.65 + Math.random() * 0.45;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(stemRadius, stemRadius * 1.2, stemHeight, 8), stemMat);
            stem.position.y = stemHeight / 2;
            stem.castShadow = true;
            stem.receiveShadow = true;
            stemGroup.add(stem);

            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(0.1, stemHeight * 0.45, 0);
            leaf.rotation.z = Math.PI / 2.6;
            leaf.castShadow = true;
            stemGroup.add(leaf);

            const leaf2 = leaf.clone();
            leaf2.position.set(-0.12, stemHeight * 0.6, 0.05);
            leaf2.rotation.z = -Math.PI / 2.4;
            stemGroup.add(leaf2);

            const headGroup = new THREE.Group();
            headGroup.position.y = stemHeight + 0.05;

            const center = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), centerMat);
            center.rotation.x = Math.PI / 2;
            center.castShadow = true;
            headGroup.add(center);

            const petalCount = 10 + Math.floor(Math.random() * 4);
            for (let p = 0; p < petalCount; p++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                const angle = (p / petalCount) * Math.PI * 2;
                petal.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
                petal.rotation.x = Math.PI / 2;
                petal.rotation.z = angle;
                petal.castShadow = true;
                headGroup.add(petal);
            }

            stemGroup.add(headGroup);

            const radius = soilRadius * 0.65 * Math.sqrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            stemGroup.position.set(Math.cos(theta) * radius, soilHeight - 0.02, Math.sin(theta) * radius);

            const baseRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
            stemGroup.rotation.copy(baseRotation);

            this.stems.push({
                group: stemGroup,
                head: headGroup,
                baseRotation,
                phase: Math.random() * Math.PI * 2,
                headPhase: Math.random() * Math.PI * 2,
                swaySpeed: 0.4 + Math.random() * 0.6,
                headSpeed: 0.7 + Math.random() * 0.5,
                swayAmount: 0.03 + Math.random() * 0.03,
                headNod: 0.15 + Math.random() * 0.1
            });

            group.add(stemGroup);
        }

        return group;
    }

    update(dt) {
        this.time += dt;
        this.stems.forEach((stem) => {
            stem.phase += dt * stem.swaySpeed;
            stem.headPhase += dt * stem.headSpeed;

            stem.group.rotation.x = stem.baseRotation.x + Math.sin(stem.phase) * stem.swayAmount;
            stem.group.rotation.z = stem.baseRotation.z + Math.cos(stem.phase) * stem.swayAmount * 0.8;
            stem.group.rotation.y = stem.baseRotation.y;

            stem.head.rotation.x = Math.sin(stem.headPhase) * stem.headNod + 0.1;
            stem.head.rotation.y = Math.cos(stem.headPhase * 0.6) * 0.2;
        });
    }
}

EntityRegistry.register('sunflowerPatch', SunflowerPatchEntity);
