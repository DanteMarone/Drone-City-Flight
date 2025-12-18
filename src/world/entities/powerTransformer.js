import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class PowerTransformerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'powerTransformer';
        this.elapsed = Math.random() * Math.PI * 2;
        this.statusLight = null;
        this.lightHandle = null;
    }

    static get displayName() { return 'Power Transformer'; }

    createMesh(params) {
        const group = new THREE.Group();

        const padWidth = params.padWidth || 2.4;
        const padDepth = params.padDepth || 1.8;
        const padHeight = 0.22;
        const cabinetWidth = params.cabinetWidth || 1.7;
        const cabinetHeight = params.cabinetHeight || 1.5;
        const cabinetDepth = params.cabinetDepth || 1.05;

        // Concrete equipment pad
        const padMap = TextureGenerator.createConcrete({ scale: 2 });
        padMap.wrapS = THREE.RepeatWrapping;
        padMap.wrapT = THREE.RepeatWrapping;
        padMap.repeat.set(1.8, 1.2);

        const padMat = new THREE.MeshStandardMaterial({
            map: padMap,
            roughness: 0.95,
            color: 0xb0b0b0
        });
        const pad = new THREE.Mesh(new THREE.BoxGeometry(padWidth, padHeight, padDepth), padMat);
        pad.position.y = padHeight / 2;
        pad.receiveShadow = true;
        group.add(pad);

        // Main transformer cabinet with a vent-like facade
        const facade = TextureGenerator.createBuildingFacade({
            color: '#4d5f66',
            windowColor: '#3c4b51',
            floors: 7,
            cols: 4,
            width: 256,
            height: 256
        });
        facade.wrapS = THREE.RepeatWrapping;
        facade.wrapT = THREE.RepeatWrapping;
        facade.repeat.set(1.2, 0.9);

        const cabinetMat = new THREE.MeshStandardMaterial({
            map: facade,
            roughness: 0.6,
            metalness: 0.25
        });
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth, cabinetHeight, cabinetDepth), cabinetMat);
        cabinet.position.y = padHeight + cabinetHeight / 2;
        cabinet.castShadow = true;
        cabinet.receiveShadow = true;
        group.add(cabinet);

        // Cooling fins on the side
        const finGroup = new THREE.Group();
        const finGeo = new THREE.BoxGeometry(0.05, cabinetHeight * 0.8, 0.18);
        const finMat = new THREE.MeshStandardMaterial({ color: 0x3a474d, roughness: 0.65, metalness: 0.3 });
        for (let i = 0; i < 6; i++) {
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(-cabinetWidth / 2 - finGeo.parameters.width / 2, padHeight + cabinetHeight * 0.55, -cabinetDepth / 2 + 0.15 + i * 0.15);
            fin.castShadow = true;
            finGroup.add(fin);
        }
        group.add(finGroup);

        // Top bushings
        const bushingMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.35, metalness: 0.5 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0x9aa7ad, roughness: 0.5, metalness: 0.35 });
        const bushingPositions = [-0.45, 0, 0.45];
        bushingPositions.forEach((x) => {
            const stack = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), capMat);
            base.position.y = padHeight + cabinetHeight + 0.1;
            base.castShadow = true;
            stack.add(base);

            const insulator = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), bushingMat);
            insulator.position.y = base.position.y + 0.24;
            insulator.castShadow = true;
            stack.add(insulator);

            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12), capMat);
            cap.position.y = insulator.position.y + 0.18;
            cap.castShadow = true;
            stack.add(cap);

            stack.position.x = x;
            group.add(stack);
        });

        // Cable arms
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.85 });
        const arm = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth * 0.9, 0.08, 0.14), armMat);
        arm.position.set(0, padHeight + cabinetHeight + 0.22, cabinetDepth / 2 + 0.02);
        arm.castShadow = true;
        group.add(arm);

        // Safety bollards
        const bollardGeo = new THREE.CylinderGeometry(0.07, 0.07, padHeight + 0.8, 10);
        const bollardMat = new THREE.MeshStandardMaterial({ color: 0xd8c262, roughness: 0.6, metalness: 0.2 });
        const bollardPositions = [
            [padWidth / 2 - 0.2, cabinetDepth / 2],
            [-padWidth / 2 + 0.2, cabinetDepth / 2],
            [padWidth / 2 - 0.2, -cabinetDepth / 2],
            [-padWidth / 2 + 0.2, -cabinetDepth / 2]
        ];
        bollardPositions.forEach(([x, z]) => {
            const bollard = new THREE.Mesh(bollardGeo, bollardMat);
            bollard.position.set(x, (padHeight + 0.8) / 2, z);
            bollard.castShadow = true;
            bollard.receiveShadow = true;
            group.add(bollard);
        });

        // Status light on the front of the cabinet
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0x4cff7f,
            emissive: new THREE.Color(0x4cff7f),
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.4
        });
        const lightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), lightMat);
        lightMesh.position.set(cabinetWidth / 2 + 0.05, padHeight + cabinetHeight * 0.7, cabinetDepth * 0.25);
        lightMesh.castShadow = false;
        this.statusLight = lightMesh;
        group.add(lightMesh);

        // Register virtual light for the LED glow
        if (params.lightSystem) {
            this.lightHandle = params.lightSystem.register({
                position: lightMesh.position.clone(),
                color: 0x4cff7f,
                intensity: 1.0,
                range: 10,
                parentMesh: group
            });
        }

        return group;
    }

    update(dt) {
        this.elapsed += dt;
        const pulse = 0.5 + Math.sin(this.elapsed * 2.5) * 0.5;

        if (this.statusLight) {
            this.statusLight.material.emissiveIntensity = 0.6 + pulse * 0.7;
        }

        if (this.lightHandle) {
            this.lightHandle.intensity = 0.8 + pulse * 0.8;
        }
    }
}

EntityRegistry.register('powerTransformer', PowerTransformerEntity);
