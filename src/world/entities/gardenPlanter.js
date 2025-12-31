import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class GardenPlanterEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'gardenPlanter';
        this.plantSway = [];
    }

    static get displayName() { return 'Garden Planter'; }

    createMesh(params) {
        const group = new THREE.Group();

        const planterLength = params.length || 2.1 + Math.random() * 0.6;
        const planterWidth = params.width || 0.9 + Math.random() * 0.3;
        const planterHeight = params.height || 0.55 + Math.random() * 0.15;
        const legHeight = planterHeight * 0.3;

        const woodHue = 0.06 + Math.random() * 0.04;
        const woodMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(woodHue, 0.55, 0.35),
            roughness: 0.75,
            metalness: 0.05
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(woodHue, 0.45, 0.28),
            roughness: 0.7,
            metalness: 0.05
        });
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 1, metalness: 0 });

        const planterBody = new THREE.Mesh(
            new THREE.BoxGeometry(planterLength, planterHeight, planterWidth),
            woodMat
        );
        planterBody.position.y = planterHeight / 2;
        planterBody.castShadow = true;
        planterBody.receiveShadow = true;
        group.add(planterBody);

        const trimHeight = planterHeight * 0.12;
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(planterLength + 0.08, trimHeight, planterWidth + 0.08),
            trimMat
        );
        trim.position.y = planterHeight + trimHeight / 2 - 0.02;
        trim.castShadow = true;
        trim.receiveShadow = true;
        group.add(trim);

        const legGeo = new THREE.BoxGeometry(planterLength * 0.1, legHeight, planterWidth * 0.12);
        const legOffsetX = planterLength * 0.42;
        const legOffsetZ = planterWidth * 0.4;
        const legPositions = [
            [legOffsetX, legOffsetZ],
            [-legOffsetX, legOffsetZ],
            [legOffsetX, -legOffsetZ],
            [-legOffsetX, -legOffsetZ]
        ];

        legPositions.forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, trimMat);
            leg.position.set(x, legHeight / 2, z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            group.add(leg);
        });

        const soilHeight = planterHeight * 0.35;
        const soil = new THREE.Mesh(
            new THREE.BoxGeometry(planterLength * 0.92, soilHeight, planterWidth * 0.85),
            soilMat
        );
        soil.position.y = planterHeight - soilHeight / 2 - 0.04;
        soil.receiveShadow = true;
        group.add(soil);

        const plantCount = 5 + Math.floor(Math.random() * 3);
        const plantAreaX = planterLength * 0.8;
        const plantAreaZ = planterWidth * 0.7;

        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e6b2d, roughness: 0.8, metalness: 0 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4f9d3a, roughness: 0.7, metalness: 0 });

        const flowerPalette = [0xf7c94d, 0xff6fa7, 0x8bc7ff, 0xff9f1c, 0xe0ff72];

        for (let i = 0; i < plantCount; i++) {
            const plantGroup = new THREE.Group();
            const stemHeight = 0.35 + Math.random() * 0.3;

            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, stemHeight, 8), stemMat);
            stem.position.y = stemHeight / 2;
            stem.castShadow = true;
            stem.receiveShadow = true;
            plantGroup.add(stem);

            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), leafMat);
            leaf.position.set(0.08, stemHeight * 0.55, 0);
            leaf.rotation.z = Math.PI / 2.6;
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            plantGroup.add(leaf);

            const leaf2 = leaf.clone();
            leaf2.position.set(-0.08, stemHeight * 0.65, 0.04);
            leaf2.rotation.z = -Math.PI / 2.7;
            plantGroup.add(leaf2);

            const flowerColor = flowerPalette[Math.floor(Math.random() * flowerPalette.length)];
            const petalMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.6, metalness: 0.05 });
            const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, roughness: 0.5, metalness: 0.1 });

            const blossomCenter = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), centerMat);
            blossomCenter.position.y = stemHeight + 0.05;
            blossomCenter.castShadow = true;
            plantGroup.add(blossomCenter);

            const petals = new THREE.Group();
            const petalGeo = new THREE.ConeGeometry(0.05, 0.12, 6);
            for (let p = 0; p < 6; p++) {
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.set(Math.cos(p * (Math.PI / 3)) * 0.1, stemHeight + 0.05, Math.sin(p * (Math.PI / 3)) * 0.1);
                petal.rotation.x = Math.PI / 2;
                petal.castShadow = true;
                petals.add(petal);
            }
            plantGroup.add(petals);

            const posX = (Math.random() - 0.5) * plantAreaX;
            const posZ = (Math.random() - 0.5) * plantAreaZ;
            plantGroup.position.set(posX, planterHeight - soilHeight - 0.03, posZ);

            const baseRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
            plantGroup.rotation.copy(baseRotation);

            this.plantSway.push({
                group: plantGroup,
                phase: Math.random() * Math.PI * 2,
                speed: 0.6 + Math.random() * 0.9,
                amplitude: 0.03 + Math.random() * 0.03,
                baseRotation
            });

            group.add(plantGroup);
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.plantSway.forEach((plant) => {
            plant.phase += dt * plant.speed;
            plant.group.rotation.x = plant.baseRotation.x + Math.sin(plant.phase) * plant.amplitude;
            plant.group.rotation.z = plant.baseRotation.z + Math.cos(plant.phase) * plant.amplitude * 0.8;
            plant.group.rotation.y = plant.baseRotation.y;
        });
    }
}

EntityRegistry.register('gardenPlanter', GardenPlanterEntity);
