import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

function createCautionStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, 256, 256);

    const stripeWidth = 40;
    ctx.save();
    ctx.translate(128, 128);
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-128, -128);
    for (let x = -256; x < 512; x += stripeWidth * 2) {
        ctx.fillStyle = '#f7c948';
        ctx.fillRect(x, -64, stripeWidth, 512);
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(x + stripeWidth, -64, stripeWidth, 512);
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
}

export class LaunchTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'launchTower';
        this._time = 0;
        this._armPivot = null;
        this._beaconMaterial = null;
        this._warningMaterial = null;
        this._spinSpeed = params.spinSpeed ?? (0.3 + Math.random() * 0.25);
    }

    static get displayName() { return 'Launch Tower'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const height = params.height ?? (9 + Math.random() * 3);
        const armLength = params.armLength ?? (4 + Math.random() * 2);
        const beaconColor = new THREE.Color(params.beaconColor ?? 0xff6b6b);

        this.params.height = height;
        this.params.armLength = armLength;
        this.params.beaconColor = beaconColor.getHex();
        this.params.spinSpeed = this._spinSpeed;

        const baseMaterial = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete({ scale: 2 }),
            color: 0x8c8f94,
            roughness: 0.85
        });

        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            metalness: 0.6,
            roughness: 0.4
        });

        const warningMaterial = new THREE.MeshStandardMaterial({
            map: createCautionStripeTexture(),
            color: 0xffffff,
            roughness: 0.6
        });
        this._warningMaterial = warningMaterial;

        const baseHeight = 0.6;
        const base = new THREE.Mesh(new THREE.BoxGeometry(8, baseHeight, 8), baseMaterial);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, height, 18), towerMaterial);
        tower.position.y = baseHeight + height / 2;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        const strutGeometry = new THREE.BoxGeometry(0.2, height * 0.9, 0.3);
        for (let i = 0; i < 4; i++) {
            const strut = new THREE.Mesh(strutGeometry, towerMaterial);
            const angle = (i / 4) * Math.PI * 2;
            strut.position.set(Math.cos(angle) * 0.95, baseHeight + height * 0.45, Math.sin(angle) * 0.95);
            strut.rotation.y = angle;
            strut.castShadow = true;
            group.add(strut);
        }

        const platform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), towerMaterial);
        platform.position.y = baseHeight + height + 0.1;
        platform.castShadow = true;
        group.add(platform);

        const armPivot = new THREE.Group();
        armPivot.position.y = baseHeight + height * 0.65;
        group.add(armPivot);
        this._armPivot = armPivot;

        const armBeam = new THREE.Mesh(new THREE.BoxGeometry(armLength, 0.25, 0.35), warningMaterial);
        armBeam.position.x = armLength / 2;
        armBeam.castShadow = true;
        armPivot.add(armBeam);

        const armBrace = new THREE.Mesh(new THREE.BoxGeometry(armLength * 0.55, 0.18, 0.18), towerMaterial);
        armBrace.position.set(armLength * 0.3, -0.25, 0);
        armBrace.rotation.z = -Math.PI / 10;
        armPivot.add(armBrace);

        const serviceRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 10, 24), towerMaterial);
        serviceRing.position.set(armLength, 0.05, 0);
        serviceRing.rotation.y = Math.PI / 2;
        armPivot.add(serviceRing);

        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 16), baseMaterial);
        tank.position.set(-1.8, baseHeight + 1.1, 1.6);
        tank.castShadow = true;
        group.add(tank);

        const tankCap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 14), baseMaterial);
        tankCap.position.set(-1.8, baseHeight + 2.2, 1.6);
        tankCap.scale.y = 0.6;
        group.add(tankCap);

        const beaconMaterial = new THREE.MeshStandardMaterial({
            color: beaconColor,
            emissive: beaconColor,
            emissiveIntensity: 1.4
        });
        this._beaconMaterial = beaconMaterial;

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), beaconMaterial);
        beacon.position.y = baseHeight + height + 0.6;
        beacon.castShadow = true;
        group.add(beacon);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), towerMaterial);
        antenna.position.y = baseHeight + height + 1.3;
        group.add(antenna);

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._armPivot) {
            this._armPivot.rotation.y += this._spinSpeed * dt;
        }

        const pulse = 0.65 + 0.35 * Math.sin(this._time * 3.2);
        if (this._beaconMaterial) {
            this._beaconMaterial.emissiveIntensity = 1.0 + pulse * 1.5;
        }

        if (this._warningMaterial) {
            this._warningMaterial.emissiveIntensity = 0.1 + pulse * 0.2;
        }
    }
}

EntityRegistry.register('launchTower', LaunchTowerEntity);
