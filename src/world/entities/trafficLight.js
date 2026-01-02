import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const PHASES = [
    { name: 'green', duration: 4.2, activeIndex: 2 },
    { name: 'yellow', duration: 1.2, activeIndex: 1 },
    { name: 'red', duration: 4.2, activeIndex: 0 }
];

export class TrafficLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'trafficLight';
        this._time = Math.random() * 2;
        this._phaseIndex = 0;
        this._lightMaterials = [];
    }

    static get displayName() { return 'Traffic Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.height || 3.4 + Math.random() * 0.6;
        const poleRadius = 0.07 + Math.random() * 0.02;
        const armLength = 0.9 + Math.random() * 0.4;
        const housingHeight = 0.7;
        const housingWidth = 0.32;
        const housingDepth = 0.26;

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: params.color || 0x2f2f3a,
            roughness: 0.5,
            metalness: 0.7
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 2.4, poleRadius * 2.6, 0.15, 16),
            metalMaterial
        );
        base.position.y = 0.075;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, poleHeight, 14),
            metalMaterial
        );
        pole.position.y = 0.15 + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(armLength, poleRadius * 1.6, poleRadius * 1.6),
            metalMaterial
        );
        arm.position.set(armLength / 2, pole.position.y + poleHeight * 0.35, 0);
        arm.castShadow = true;
        group.add(arm);

        const joint = new THREE.Mesh(
            new THREE.SphereGeometry(poleRadius * 1.25, 12, 12),
            metalMaterial
        );
        joint.position.set(0, arm.position.y, 0);
        joint.castShadow = true;
        group.add(joint);

        const housingGroup = new THREE.Group();
        housingGroup.position.set(armLength, arm.position.y - housingHeight * 0.1, 0);
        group.add(housingGroup);

        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(housingWidth, housingHeight, housingDepth),
            metalMaterial
        );
        housing.castShadow = true;
        housingGroup.add(housing);

        const hoodGeometry = new THREE.CylinderGeometry(housingWidth * 0.18, housingWidth * 0.22, housingDepth * 0.4, 14, 1, true);
        hoodGeometry.rotateX(Math.PI / 2);

        const lightColors = [0xff3b30, 0xffd60a, 0x34c759];
        for (let i = 0; i < 3; i += 1) {
            const material = new THREE.MeshStandardMaterial({
                color: lightColors[i],
                emissive: new THREE.Color(lightColors[i]),
                emissiveIntensity: 0.25,
                roughness: 0.3,
                metalness: 0.1
            });
            this._lightMaterials.push(material);

            const lens = new THREE.Mesh(
                new THREE.SphereGeometry(housingWidth * 0.16, 16, 16),
                material
            );
            lens.position.set(housingWidth * 0.15, housingHeight * 0.22 - i * housingHeight * 0.32, housingDepth * 0.52);
            housingGroup.add(lens);

            const hood = new THREE.Mesh(hoodGeometry, metalMaterial);
            hood.position.set(housingWidth * 0.15, lens.position.y, housingDepth * 0.52);
            housingGroup.add(hood);
        }

        const backPlate = new THREE.Mesh(
            new THREE.BoxGeometry(housingWidth * 0.95, housingHeight * 1.05, housingDepth * 0.1),
            metalMaterial
        );
        backPlate.position.z = -housingDepth * 0.45;
        housingGroup.add(backPlate);

        return group;
    }

    update(dt) {
        this._time += dt;
        const phase = PHASES[this._phaseIndex];
        if (this._time >= phase.duration) {
            this._time = 0;
            this._phaseIndex = (this._phaseIndex + 1) % PHASES.length;
        }

        const activeIndex = PHASES[this._phaseIndex].activeIndex;
        this._lightMaterials.forEach((material, index) => {
            const target = index === activeIndex ? 2.2 : 0.25;
            material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, target, dt * 6);
        });
    }
}

EntityRegistry.register('trafficLight', TrafficLightEntity);
