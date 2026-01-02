import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const HOUSING_COLORS = [0x1f2937, 0x111827, 0x0f172a];
const POLE_COLORS = [0x4b5563, 0x374151, 0x6b7280];

const LIGHT_STATES = [
    { name: 'green', duration: 3.2 },
    { name: 'yellow', duration: 0.8 },
    { name: 'red', duration: 2.4 }
];

export class TrafficLightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'trafficLight';
        this._time = Math.random() * 5;
        this._lightMaterials = new Map();
        this._glowMaterials = [];
        this._cycleDuration = LIGHT_STATES.reduce((sum, state) => sum + state.duration, 0);
    }

    static get displayName() { return 'Traffic Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight || 3.1 + Math.random() * 0.6;
        const poleRadius = 0.06 + Math.random() * 0.02;
        const armLength = 1.15 + Math.random() * 0.3;
        const boxHeight = 0.85 + Math.random() * 0.08;
        const boxWidth = 0.28 + Math.random() * 0.04;
        const boxDepth = 0.22 + Math.random() * 0.03;

        const housingColor = params.housingColor || HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)];
        const poleColor = params.poleColor || POLE_COLORS[Math.floor(Math.random() * POLE_COLORS.length)];

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: poleColor,
            roughness: 0.55,
            metalness: 0.7
        });

        const housingMaterial = new THREE.MeshStandardMaterial({
            color: housingColor,
            roughness: 0.4,
            metalness: 0.6
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 2.2, poleRadius * 2.4, 0.16, 14),
            poleMaterial
        );
        base.position.y = 0.08;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, poleHeight, 14),
            poleMaterial
        );
        pole.position.y = poleHeight / 2 + base.position.y;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 0.8, poleRadius * 0.9, armLength, 12),
            poleMaterial
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(armLength / 2, pole.position.y + poleHeight * 0.3, 0);
        arm.castShadow = true;
        group.add(arm);

        const junction = new THREE.Mesh(
            new THREE.SphereGeometry(poleRadius * 1.1, 12, 12),
            poleMaterial
        );
        junction.position.set(0, arm.position.y, 0);
        junction.castShadow = true;
        group.add(junction);

        const signalGroup = new THREE.Group();
        signalGroup.position.set(armLength, arm.position.y - boxHeight * 0.35, 0);
        group.add(signalGroup);

        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth),
            housingMaterial
        );
        housing.castShadow = true;
        housing.receiveShadow = true;
        signalGroup.add(housing);

        const visorGeo = new THREE.CylinderGeometry(boxWidth * 0.28, boxWidth * 0.32, boxDepth * 0.5, 12, 1, true);
        visorGeo.rotateX(Math.PI / 2);

        const visorOffsets = [
            boxHeight * 0.28,
            0,
            -boxHeight * 0.28
        ];

        visorOffsets.forEach(offset => {
            const visor = new THREE.Mesh(visorGeo, housingMaterial);
            visor.position.set(0, offset, boxDepth * 0.28);
            visor.castShadow = true;
            signalGroup.add(visor);
        });

        const lightColors = {
            red: new THREE.Color(0xff3b3b),
            yellow: new THREE.Color(0xffd65a),
            green: new THREE.Color(0x52ff7a)
        };

        const lensGeo = new THREE.CylinderGeometry(boxWidth * 0.22, boxWidth * 0.24, boxDepth * 0.18, 16);
        lensGeo.rotateX(Math.PI / 2);

        const lensGlass = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.35,
            metalness: 0.2
        });

        ['red', 'yellow', 'green'].forEach((state, index) => {
            const color = lightColors[state];
            const glowMaterial = new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.2,
                roughness: 0.2,
                metalness: 0.1
            });
            this._glowMaterials.push(glowMaterial);
            this._lightMaterials.set(state, glowMaterial);

            const bulb = new THREE.Mesh(lensGeo, glowMaterial);
            bulb.position.set(0, visorOffsets[index], boxDepth * 0.15);
            signalGroup.add(bulb);

            const lensCover = new THREE.Mesh(
                new THREE.CylinderGeometry(boxWidth * 0.24, boxWidth * 0.26, boxDepth * 0.12, 16),
                lensGlass
            );
            lensCover.rotation.x = Math.PI / 2;
            lensCover.position.set(0, visorOffsets[index], boxDepth * 0.21);
            signalGroup.add(lensCover);
        });

        const serviceBox = new THREE.Mesh(
            new THREE.BoxGeometry(boxWidth * 0.35, boxHeight * 0.28, boxDepth * 0.55),
            housingMaterial
        );
        serviceBox.position.set(-boxWidth * 0.45, -boxHeight * 0.2, 0);
        serviceBox.castShadow = true;
        signalGroup.add(serviceBox);

        const pedestrian = new THREE.Mesh(
            new THREE.BoxGeometry(boxWidth * 0.38, boxHeight * 0.32, boxDepth * 0.3),
            housingMaterial
        );
        pedestrian.position.set(-boxWidth * 0.4, boxHeight * 0.22, -boxDepth * 0.25);
        pedestrian.castShadow = true;
        signalGroup.add(pedestrian);

        const walkLight = new THREE.Mesh(
            new THREE.BoxGeometry(boxWidth * 0.18, boxHeight * 0.12, boxDepth * 0.06),
            new THREE.MeshStandardMaterial({
                color: 0xa7f3d0,
                emissive: 0x34d399,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.85
            })
        );
        walkLight.position.set(-boxWidth * 0.4, boxHeight * 0.24, -boxDepth * 0.09);
        signalGroup.add(walkLight);

        return group;
    }

    update(dt) {
        this._time += dt;
        const cycleTime = this._time % this._cycleDuration;

        let cursor = 0;
        let activeState = 'red';
        for (const state of LIGHT_STATES) {
            cursor += state.duration;
            if (cycleTime <= cursor) {
                activeState = state.name;
                break;
            }
        }

        for (const [state, material] of this._lightMaterials) {
            const isActive = state === activeState;
            const pulse = isActive ? 1.3 + Math.sin(this._time * 6) * 0.2 : 0.1;
            material.emissiveIntensity = pulse;
        }
    }
}

EntityRegistry.register('trafficLight', TrafficLightEntity);
