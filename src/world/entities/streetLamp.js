import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const METAL_COLORS = [
    0x1f2937,
    0x374151,
    0x4b5563,
    0x111827
];

const GLOW_COLORS = [
    0xfff0b3,
    0xffd6a3,
    0xc7f0ff,
    0xd1c4ff
];

export class StreetLampEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetLamp';
        this._time = Math.random() * Math.PI * 2;
        this._glowMaterials = [];
        this._ringMesh = null;
    }

    static get displayName() { return 'Street Lamp'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.height || 3.6 + Math.random() * 1.2;
        const poleRadius = 0.07 + Math.random() * 0.03;
        const baseHeight = 0.18 + Math.random() * 0.08;
        const baseRadius = poleRadius * (2.4 + Math.random() * 0.5);
        const armLength = 0.85 + Math.random() * 0.45;
        const headWidth = 0.42 + Math.random() * 0.08;
        const headDepth = 0.32 + Math.random() * 0.06;
        const headHeight = 0.16 + Math.random() * 0.05;

        const metalColor = params.color || METAL_COLORS[Math.floor(Math.random() * METAL_COLORS.length)];
        const glowColor = new THREE.Color(params.glowColor || GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)]);

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: metalColor,
            roughness: 0.45,
            metalness: 0.8
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius, baseHeight, 14),
            metalMaterial
        );
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius * 1.02, poleHeight, 12),
            metalMaterial
        );
        pole.position.y = baseHeight + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const bracket = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 0.7, poleRadius * 0.7, armLength, 10),
            metalMaterial
        );
        bracket.rotation.z = Math.PI / 2;
        bracket.position.set(armLength / 2, baseHeight + poleHeight * 0.9, 0);
        bracket.castShadow = true;
        group.add(bracket);

        const joint = new THREE.Mesh(
            new THREE.SphereGeometry(poleRadius * 1.1, 12, 12),
            metalMaterial
        );
        joint.position.set(0, bracket.position.y, 0);
        joint.castShadow = true;
        group.add(joint);

        const headGroup = new THREE.Group();
        headGroup.position.set(armLength, bracket.position.y, 0);
        group.add(headGroup);

        const headHousing = new THREE.Mesh(
            new THREE.BoxGeometry(headWidth, headHeight, headDepth),
            metalMaterial
        );
        headHousing.position.x = headWidth / 2;
        headHousing.castShadow = true;
        headGroup.add(headHousing);

        const headCap = new THREE.Mesh(
            new THREE.CylinderGeometry(headWidth * 0.55, headWidth * 0.7, headHeight * 0.5, 12),
            metalMaterial
        );
        headCap.rotation.z = Math.PI / 2;
        headCap.position.set(headWidth * 0.6, headHeight * 0.25, 0);
        headCap.castShadow = true;
        headGroup.add(headCap);

        const glowMaterial = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 1.4,
            roughness: 0.25,
            metalness: 0.1
        });
        this._glowMaterials.push(glowMaterial);

        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(headHeight * 0.35, 12, 12),
            glowMaterial
        );
        bulb.position.set(headWidth * 0.55, -headHeight * 0.35, 0);
        headGroup.add(bulb);

        const lensMaterial = new THREE.MeshStandardMaterial({
            color: glowColor.clone().multiplyScalar(0.9),
            emissive: glowColor,
            emissiveIntensity: 0.9,
            roughness: 0.15,
            metalness: 0.05,
            transparent: true,
            opacity: 0.75
        });
        this._glowMaterials.push(lensMaterial);

        const lens = new THREE.Mesh(
            new THREE.CylinderGeometry(headWidth * 0.22, headWidth * 0.26, headHeight * 0.18, 16),
            lensMaterial
        );
        lens.rotation.z = Math.PI / 2;
        lens.position.set(headWidth * 0.65, -headHeight * 0.25, 0);
        headGroup.add(lens);

        const ringMaterial = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 1.2,
            roughness: 0.3,
            metalness: 0.2
        });
        this._glowMaterials.push(ringMaterial);

        this._ringMesh = new THREE.Mesh(
            new THREE.TorusGeometry(headWidth * 0.34, headHeight * 0.08, 8, 24),
            ringMaterial
        );
        this._ringMesh.rotation.x = Math.PI / 2;
        this._ringMesh.position.set(headWidth * 0.62, -headHeight * 0.25, 0);
        headGroup.add(this._ringMesh);

        const coneMaterial = new THREE.MeshStandardMaterial({
            color: glowColor.clone().multiplyScalar(0.8),
            emissive: glowColor,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.35,
            roughness: 0.4,
            metalness: 0.0
        });
        this._glowMaterials.push(coneMaterial);

        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(headWidth * 0.35, headHeight * 2.2, 18, 1, true),
            coneMaterial
        );
        cone.position.set(headWidth * 0.6, -headHeight * 1.45, 0);
        cone.rotation.x = Math.PI;
        headGroup.add(cone);

        const controlBox = new THREE.Mesh(
            new THREE.BoxGeometry(headDepth * 0.6, headDepth * 0.5, headDepth * 0.4),
            metalMaterial
        );
        controlBox.position.set(poleRadius * 2.2, baseHeight + poleHeight * 0.35, 0.18);
        controlBox.castShadow = true;
        group.add(controlBox);

        return group;
    }

    update(dt) {
        this._time += dt;
        const pulse = 1 + Math.sin(this._time * 2.3) * 0.18;
        for (const material of this._glowMaterials) {
            material.emissiveIntensity = 0.9 * pulse + 0.4;
        }
        if (this._ringMesh) {
            this._ringMesh.rotation.z += dt * 0.9;
        }
    }
}

EntityRegistry.register('streetLamp', StreetLampEntity);
