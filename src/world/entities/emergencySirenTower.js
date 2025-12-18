import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class EmergencySirenTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'emergencySirenTower';
        this._time = 0;
        this._sirenHub = null;
        this._lightMaterials = [];
        this._lightPositions = [];
        this._virtualLights = [];
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Emergency Siren Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const concreteTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9fa4ad,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.15
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.5, 16), baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const columnMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.35,
            metalness: 0.75
        });
        const columnHeight = params.height || 4 + Math.random() * 0.5;
        this.params.height = columnHeight;
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, columnHeight, 16), columnMaterial);
        column.position.y = columnHeight / 2 + base.position.y;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const braceGeo = new THREE.BoxGeometry(0.08, columnHeight * 0.6, 0.14);
        const braceOffset = 0.2;
        const brace1 = new THREE.Mesh(braceGeo, columnMaterial);
        brace1.position.set(braceOffset, column.position.y, braceOffset);
        const brace2 = brace1.clone();
        brace2.position.set(-braceOffset, column.position.y, braceOffset);
        const brace3 = brace1.clone();
        brace3.position.set(braceOffset, column.position.y, -braceOffset);
        const brace4 = brace1.clone();
        brace4.position.set(-braceOffset, column.position.y, -braceOffset);
        [brace1, brace2, brace3, brace4].forEach(b => {
            b.castShadow = true;
            b.receiveShadow = true;
            group.add(b);
        });

        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.4
        });
        const capPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.18, 20), capMaterial);
        capPlate.position.y = column.position.y + columnHeight / 2 + 0.09;
        capPlate.castShadow = true;
        capPlate.receiveShadow = true;
        group.add(capPlate);

        const accent = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 24), new THREE.MeshStandardMaterial({
            color: 0xd33c3c,
            roughness: 0.4,
            metalness: 0.6
        }));
        accent.rotation.x = Math.PI / 2;
        accent.position.y = capPlate.position.y + 0.05;
        accent.castShadow = true;
        accent.receiveShadow = true;
        group.add(accent);

        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.45,
            metalness: 0.35
        });
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.12), shieldMat);
        shield.position.set(0, capPlate.position.y + 0.6, -0.35);
        shield.castShadow = true;
        shield.receiveShadow = true;
        group.add(shield);

        const crestMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0x3b82f6),
            emissiveIntensity: 0.35,
            roughness: 0.3,
            metalness: 0.3
        });
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.06), crestMat);
        crest.position.set(0, shield.position.y, shield.position.z + 0.08);
        crest.castShadow = true;
        crest.receiveShadow = true;
        group.add(crest);

        const speakerMat = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1,
            roughness: 0.55,
            metalness: 0.35
        });
        const speakerGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.4, 12, 1, true);
        const speakerOffsets = [
            new THREE.Vector3(0.35, capPlate.position.y + 0.3, 0),
            new THREE.Vector3(-0.35, capPlate.position.y + 0.3, 0),
            new THREE.Vector3(0, capPlate.position.y + 0.3, 0.35),
            new THREE.Vector3(0, capPlate.position.y + 0.3, -0.35)
        ];
        speakerOffsets.forEach(offset => {
            const speaker = new THREE.Mesh(speakerGeo, speakerMat);
            speaker.position.copy(offset);
            speaker.rotation.z = Math.PI / 2;
            if (offset.x < 0) speaker.rotation.y = Math.PI;
            if (offset.z > 0) speaker.rotation.y = Math.PI / 2;
            if (offset.z < 0) speaker.rotation.y = -Math.PI / 2;
            speaker.castShadow = true;
            speaker.receiveShadow = true;
            group.add(speaker);
        });

        const hub = new THREE.Group();
        hub.position.y = capPlate.position.y + 0.3;
        group.add(hub);
        this._sirenHub = hub;

        const hubBody = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.4, 16), capMaterial);
        hubBody.castShadow = true;
        hubBody.receiveShadow = true;
        hub.add(hubBody);

        const domeGeo = new THREE.SphereGeometry(0.2, 14, 14);
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xf87171,
            emissive: new THREE.Color(0xef4444),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.1
        });
        const blueMat = new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            emissive: new THREE.Color(0x3b82f6),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.1
        });
        this._lightMaterials = [redMat, blueMat];

        const redLamp = new THREE.Mesh(domeGeo, redMat);
        redLamp.position.set(0.32, 0.1, 0);
        hub.add(redLamp);

        const blueLamp = new THREE.Mesh(domeGeo, blueMat);
        blueLamp.position.set(-0.32, 0.1, 0);
        hub.add(blueLamp);

        const cageGeo = new THREE.TorusGeometry(0.32, 0.02, 8, 20);
        const cage = new THREE.Mesh(cageGeo, columnMaterial);
        cage.rotation.x = Math.PI / 2;
        cage.position.y = 0.05;
        cage.castShadow = true;
        cage.receiveShadow = true;
        hub.add(cage);

        const topper = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 12), columnMaterial);
        topper.position.y = 0.32;
        topper.castShadow = true;
        topper.receiveShadow = true;
        hub.add(topper);

        this._lightPositions = [
            redLamp.position.clone(),
            blueLamp.position.clone()
        ];

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightPositions.length > 0 && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            this._virtualLights = this._lightPositions.map((pos, index) => {
                const worldPos = pos.clone().applyMatrix4(this.mesh.matrixWorld);
                const color = index === 0 ? 0xef4444 : 0x3b82f6;
                const handle = lightSystem.register(
                    worldPos,
                    color,
                    this.params.lightIntensity || 2.2,
                    16
                );
                if (handle) {
                    handle.parentMesh = this.mesh;
                }
                return handle;
            });
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const sway = Math.sin(this._time * 0.6 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.5);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x + sway * 0.2,
                this._baseRotation.y,
                this._baseRotation.z + sway
            );
        }

        if (this._sirenHub) {
            this._sirenHub.rotation.y += dt * 1.6;
        }

        const phase = this._time * 4;
        const redPulse = 0.5 + 0.5 * Math.max(Math.sin(phase), 0);
        const bluePulse = 0.5 + 0.5 * Math.max(Math.sin(phase + Math.PI), 0);
        const pulses = [redPulse, bluePulse];

        this._lightMaterials.forEach((mat, idx) => {
            if (mat) {
                const base = 0.6;
                mat.emissiveIntensity = base + pulses[idx] * 1.1;
            }
        });

        this._virtualLights.forEach((light, idx) => {
            if (light) {
                const base = this.params.lightIntensity || 2.2;
                light.intensity = THREE.MathUtils.clamp(base * (0.5 + pulses[idx]), base * 0.6, base * 1.5);
            }
        });
    }
}

EntityRegistry.register('emergencySirenTower', EmergencySirenTowerEntity);
