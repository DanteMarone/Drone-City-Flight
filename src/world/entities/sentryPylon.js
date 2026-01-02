import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SentryPylonEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sentryPylon';
        this._time = Math.random() * Math.PI * 2;
        this._headGroup = null;
        this._glowMaterials = [];
        this._spinSpeed = params.spinSpeed ?? (0.8 + Math.random() * 0.6);
        this._pulseSpeed = params.pulseSpeed ?? (2.6 + Math.random() * 0.6);
    }

    static get displayName() {
        return 'Sentry Pylon';
    }

    createWarningTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1b1f24';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);

        for (let i = -6; i <= 6; i += 1) {
            ctx.fillStyle = i % 2 === 0 ? '#d97706' : '#f5c542';
            ctx.fillRect(-128, i * 16, 256, 10);
        }

        ctx.restore();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 1.5);
        return texture;
    }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? 0.65 + Math.random() * 0.2;
        const baseHeight = 0.2;
        const columnHeight = params.columnHeight ?? 1.4 + Math.random() * 0.4;
        const accentColor = new THREE.Color(params.accentColor ?? 0xff3b30);

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2c323a,
            roughness: 0.85,
            metalness: 0.2
        });
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 1.05, baseRadius * 1.2, baseHeight, 20),
            baseMat
        );
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const warningMat = new THREE.MeshStandardMaterial({
            map: this.createWarningTexture(),
            roughness: 0.6,
            metalness: 0.2
        });
        const collar = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius * 1.05, 0.18, 18),
            warningMat
        );
        collar.position.y = baseHeight + 0.09;
        collar.castShadow = true;
        group.add(collar);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.5,
            metalness: 0.6
        });
        const column = new THREE.Mesh(
            new THREE.BoxGeometry(baseRadius * 0.7, columnHeight, baseRadius * 0.7),
            columnMat
        );
        column.position.y = baseHeight + 0.09 + columnHeight / 2;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const headGroup = new THREE.Group();
        headGroup.position.y = baseHeight + 0.09 + columnHeight + 0.3;
        this._headGroup = headGroup;
        group.add(headGroup);

        const headMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.4,
            metalness: 0.85
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), headMat);
        head.castShadow = true;
        headGroup.add(head);

        const eyeMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.4
        });
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
        eye.position.set(0, 0, 0.26);
        headGroup.add(eye);
        this._glowMaterials.push(eyeMat);

        const lensMat = new THREE.MeshStandardMaterial({
            color: 0x0b1118,
            emissive: new THREE.Color(0x1f2937),
            emissiveIntensity: 0.2,
            roughness: 0.15,
            metalness: 0.9
        });
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 0, 0.32);
        headGroup.add(lens);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xff6b5c,
            emissive: new THREE.Color(0xff6b5c),
            emissiveIntensity: 0.65,
            roughness: 0.3,
            metalness: 0.2
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 10, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        headGroup.add(ring);
        this._glowMaterials.push(ringMat);

        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.5,
            metalness: 0.7
        });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 12), antennaMat);
        antenna.position.set(0.18, 0.32, -0.05);
        antenna.rotation.z = Math.PI / 8;
        headGroup.add(antenna);

        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xffc857,
            emissive: new THREE.Color(0xffc857),
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.2
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), beaconMat);
        beacon.position.set(0.24, 0.55, -0.06);
        headGroup.add(beacon);
        this._glowMaterials.push(beaconMat);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._headGroup) {
            this._headGroup.rotation.y += dt * this._spinSpeed;
        }

        const pulse = 0.6 + 0.4 * Math.sin(this._time * this._pulseSpeed);
        this._glowMaterials.forEach((material, index) => {
            material.emissiveIntensity = pulse + index * 0.1;
        });
    }
}

EntityRegistry.register('sentryPylon', SentryPylonEntity);
