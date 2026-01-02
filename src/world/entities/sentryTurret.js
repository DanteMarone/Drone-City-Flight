import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createHazardStripeTexture({ base = '#2b2b2b', stripe = '#f59e0b' } = {}) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = stripe;
    ctx.lineWidth = 40;
    for (let i = -size; i < size * 2; i += 70) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

export class SentryTurretEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sentryTurret';
        this._time = 0;
        this._headGroup = null;
        this._barrelGroup = null;
        this._eyeMaterial = null;
        this._pulseMaterial = null;
        this._scanSpeed = params.scanSpeed ?? (0.6 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.2 + Math.random() * 0.6);
        this._recoilPhase = params.recoilPhase ?? Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Sentry Turret'; }

    createMesh() {
        const group = new THREE.Group();

        this.params.scanSpeed = this._scanSpeed;
        this.params.pulseSpeed = this._pulseSpeed;
        this.params.recoilPhase = this._recoilPhase;

        const hazardTex = createHazardStripeTexture();
        hazardTex.repeat.set(1, 1);

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: hazardTex,
            roughness: 0.7,
            metalness: 0.25
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.5, 16), baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const footingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.8,
            metalness: 0.1
        });
        const footing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.12, 18), footingMaterial);
        footing.position.y = 0.06;
        footing.castShadow = true;
        footing.receiveShadow = true;
        group.add(footing);

        const columnMaterial = new THREE.MeshStandardMaterial({
            color: 0x374151,
            roughness: 0.4,
            metalness: 0.6
        });
        const columnHeight = 1.6 + Math.random() * 0.3;
        this.params.columnHeight = columnHeight;
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, columnHeight, 12), columnMaterial);
        column.position.y = base.position.y + columnHeight / 2 + 0.1;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const braceGeo = new THREE.BoxGeometry(0.12, columnHeight * 0.6, 0.4);
        const braceOffsets = [
            new THREE.Vector3(0.4, column.position.y, 0),
            new THREE.Vector3(-0.4, column.position.y, 0),
            new THREE.Vector3(0, column.position.y, 0.4),
            new THREE.Vector3(0, column.position.y, -0.4)
        ];
        braceOffsets.forEach(offset => {
            const brace = new THREE.Mesh(braceGeo, columnMaterial);
            brace.position.copy(offset);
            if (offset.z !== 0) {
                brace.rotation.y = Math.PI / 2;
            }
            brace.castShadow = true;
            brace.receiveShadow = true;
            group.add(brace);
        });

        const headGroup = new THREE.Group();
        headGroup.position.y = column.position.y + columnHeight / 2 + 0.35;
        this._headGroup = headGroup;
        group.add(headGroup);

        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.35,
            metalness: 0.7
        });
        const headCore = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1), headMaterial);
        headCore.position.y = 0.05;
        headCore.castShadow = true;
        headCore.receiveShadow = true;
        headGroup.add(headCore);

        const armorMaterial = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.45,
            metalness: 0.6
        });
        const armor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.9), armorMaterial);
        armor.position.set(0, 0.25, -0.05);
        armor.rotation.x = -Math.PI / 12;
        armor.castShadow = true;
        armor.receiveShadow = true;
        headGroup.add(armor);

        const barrelGroup = new THREE.Group();
        barrelGroup.position.set(0, 0.05, 0.65);
        this._barrelGroup = barrelGroup;
        headGroup.add(barrelGroup);

        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.3,
            metalness: 0.8
        });
        const barrelGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.9, 10);
        const leftBarrel = new THREE.Mesh(barrelGeo, barrelMaterial);
        leftBarrel.rotation.x = Math.PI / 2;
        leftBarrel.position.set(-0.18, 0, 0.35);
        leftBarrel.castShadow = true;
        leftBarrel.receiveShadow = true;
        barrelGroup.add(leftBarrel);

        const rightBarrel = leftBarrel.clone();
        rightBarrel.position.x = 0.18;
        barrelGroup.add(rightBarrel);

        const muzzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.4,
            metalness: 0.5
        });
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12), muzzleMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0, 0.85);
        muzzle.castShadow = true;
        muzzle.receiveShadow = true;
        barrelGroup.add(muzzle);

        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xf87171,
            emissive: new THREE.Color(0xef4444),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.2
        });
        this._eyeMaterial = eyeMaterial;
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), eyeMaterial);
        eye.position.set(0, 0.15, 0.45);
        eye.castShadow = true;
        headGroup.add(eye);

        const pulseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: new THREE.Color(0xf97316),
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.6,
            roughness: 0.3,
            metalness: 0.2
        });
        this._pulseMaterial = pulseMaterial;
        const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 12, 24), pulseMaterial);
        pulseRing.rotation.x = Math.PI / 2;
        pulseRing.position.set(0, 0.2, 0.2);
        pulseRing.castShadow = true;
        headGroup.add(pulseRing);

        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.4,
            metalness: 0.6
        });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), antennaMaterial);
        antenna.position.set(-0.35, 0.5, -0.2);
        antenna.castShadow = true;
        headGroup.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), eyeMaterial);
        antennaTip.position.set(-0.35, 0.85, -0.2);
        antennaTip.castShadow = true;
        headGroup.add(antennaTip);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._headGroup) {
            this._headGroup.rotation.y = Math.sin(this._time * this._scanSpeed) * 0.6;
        }
        if (this._barrelGroup) {
            const recoil = 0.04 * Math.sin(this._time * (this._pulseSpeed * 1.4) + this._recoilPhase);
            this._barrelGroup.position.z = 0.65 + recoil;
        }
        if (this._eyeMaterial) {
            this._eyeMaterial.emissiveIntensity = 0.8 + Math.sin(this._time * this._pulseSpeed) * 0.4;
        }
        if (this._pulseMaterial) {
            this._pulseMaterial.emissiveIntensity = 0.4 + Math.abs(Math.sin(this._time * this._pulseSpeed));
        }
    }
}

EntityRegistry.register('sentryTurret', SentryTurretEntity);
