import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class ParkBenchEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parkBench';
        this.swayPhase = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Park Bench'; }

    createMesh(params) {
        const group = new THREE.Group();

        const seatLength = params.length || 3 + Math.random() * 0.5;
        const seatDepth = params.depth || 0.65;
        const seatHeight = params.height || 0.55;
        const slatThickness = 0.08;
        const slatGap = 0.05;

        const woodColor = new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.6, 0.4 + Math.random() * 0.1);
        const metalColor = 0x444b55;

        const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.6, metalness: 0.1 });
        const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.4, metalness: 0.6 });

        const makeSlat = (length, depth, thickness) => {
            const geo = new THREE.BoxGeometry(length, thickness, depth);
            const mesh = new THREE.Mesh(geo, woodMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        };

        const seatGroup = new THREE.Group();
        const seatSlats = 4 + Math.floor(Math.random() * 2);
        const seatDepthUsed = seatSlats * slatThickness + (seatSlats - 1) * slatGap;
        for (let i = 0; i < seatSlats; i++) {
            const slat = makeSlat(seatLength, slatThickness, slatThickness);
            slat.position.set(0, seatHeight, -seatDepthUsed / 2 + slatThickness / 2 + i * (slatThickness + slatGap));
            seatGroup.add(slat);
        }

        const backGroup = new THREE.Group();
        const backSlats = 3;
        for (let i = 0; i < backSlats; i++) {
            const slat = makeSlat(seatLength, slatThickness, slatThickness);
            slat.position.set(0, seatHeight + 0.25 + i * (slatThickness + slatGap), -seatDepth / 2 - 0.05);
            backGroup.add(slat);
        }
        backGroup.rotation.x = -0.35;

        group.add(seatGroup);
        group.add(backGroup);

        const legOffset = seatLength * 0.45;
        const legHeight = seatHeight - 0.05;
        const legDepth = 0.18;
        const legWidth = 0.12;

        const createLeg = (x) => {
            const legGroup = new THREE.Group();

            const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), metalMat);
            frontLeg.position.set(x, legHeight / 2, -seatDepth / 2 + legDepth / 2);
            frontLeg.castShadow = true;
            frontLeg.receiveShadow = true;
            legGroup.add(frontLeg);

            const backLeg = frontLeg.clone();
            backLeg.position.z = seatDepth / 2 - legDepth / 2;
            legGroup.add(backLeg);

            const crossBar = new THREE.Mesh(new THREE.BoxGeometry(legWidth * 0.9, 0.1, seatDepth - 0.08), metalMat);
            crossBar.position.set(x, legHeight - 0.1, 0);
            crossBar.castShadow = true;
            crossBar.receiveShadow = true;
            legGroup.add(crossBar);

            const arm = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 10, 24, Math.PI), metalMat);
            arm.rotation.z = Math.PI;
            arm.position.set(x, seatHeight + 0.05, -seatDepth / 2);
            arm.castShadow = true;
            arm.receiveShadow = true;
            legGroup.add(arm);

            return legGroup;
        };

        group.add(createLeg(legOffset));
        group.add(createLeg(-legOffset));

        const centerBrace = new THREE.Mesh(new THREE.BoxGeometry(seatLength * 0.9, 0.12, 0.12), metalMat);
        centerBrace.position.set(0, seatHeight - 0.15, 0);
        centerBrace.castShadow = true;
        centerBrace.receiveShadow = true;
        group.add(centerBrace);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.swayPhase += dt;
        const sway = Math.sin(this.swayPhase) * 0.02;
        this.mesh.rotation.y = this.rotation.y + sway;
    }
}

EntityRegistry.register('parkBench', ParkBenchEntity);
