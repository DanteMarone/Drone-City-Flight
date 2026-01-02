import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createThermalTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f3f1ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileW = 20;
    const tileH = 16;
    for (let y = 0; y < canvas.height; y += tileH) {
        for (let x = 0; x < canvas.width; x += tileW) {
            const offset = (y / tileH) % 2 === 0 ? 0 : tileW * 0.5;
            const tileX = x + offset;
            ctx.fillStyle = Math.random() > 0.8 ? '#d9d2c9' : '#e7e1d8';
            ctx.fillRect(tileX, y, tileW - 2, tileH - 2);
        }
    }

    ctx.strokeStyle = 'rgba(40,40,40,0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y < canvas.height; y += tileH) {
        ctx.beginPath();
        ctx.moveTo(0, y + tileH - 2);
        ctx.lineTo(canvas.width, y + tileH - 2);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
};

export class SpaceShuttleEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'spaceShuttle';
        this.time = Math.random() * 100;
        this.enginePulseSpeed = params.enginePulseSpeed || 3.2;
        this.enginePulseStrength = params.enginePulseStrength || 0.7;
    }

    static get displayName() { return 'Space Shuttle'; }

    createMesh(params) {
        const bodyLength = params.bodyLength || 12 + Math.random() * 1.5;
        const bodyRadius = params.bodyRadius || 1.4 + Math.random() * 0.2;
        const wingSpan = params.wingSpan || 6.5 + Math.random() * 0.8;
        const wingLength = params.wingLength || 6.2 + Math.random() * 0.6;
        const tailHeight = params.tailHeight || 2.6 + Math.random() * 0.4;

        this.params.bodyLength = bodyLength;
        this.params.bodyRadius = bodyRadius;
        this.params.wingSpan = wingSpan;
        this.params.wingLength = wingLength;
        this.params.tailHeight = tailHeight;
        this.params.enginePulseSpeed = this.enginePulseSpeed;
        this.params.enginePulseStrength = this.enginePulseStrength;

        const group = new THREE.Group();

        const tileMaterial = new THREE.MeshStandardMaterial({
            map: createThermalTileTexture(),
            roughness: 0.7,
            metalness: 0.15
        });

        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1b1d24,
            roughness: 0.8,
            metalness: 0.1
        });

        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b4156,
            emissive: 0x0a1f33,
            emissiveIntensity: 0.4,
            roughness: 0.2,
            metalness: 0.3
        });

        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b2f36,
            roughness: 0.6,
            metalness: 0.4
        });

        this.engineGlowMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8c44,
            emissive: 0xff5d1a,
            emissiveIntensity: 1.2,
            roughness: 0.2
        });

        const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.06, bodyLength, 22, 1);
        bodyGeo.rotateZ(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, tileMaterial);
        body.position.set(0, bodyRadius + 0.5, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const noseGeo = new THREE.ConeGeometry(bodyRadius * 0.95, bodyRadius * 2.4, 20);
        noseGeo.rotateZ(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, tileMaterial);
        nose.position.set(bodyLength / 2 + bodyRadius * 0.9, bodyRadius + 0.55, 0);
        nose.castShadow = true;
        group.add(nose);

        const cockpitGeo = new THREE.SphereGeometry(bodyRadius * 0.6, 18, 14, 0, Math.PI);
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMaterial);
        cockpit.position.set(bodyLength * 0.15, bodyRadius + 1.35, 0.1);
        cockpit.rotation.y = Math.PI / 2;
        cockpit.castShadow = true;
        group.add(cockpit);

        const bellyGeo = new THREE.BoxGeometry(bodyLength * 0.65, bodyRadius * 0.4, bodyRadius * 1.6);
        const belly = new THREE.Mesh(bellyGeo, panelMaterial);
        belly.position.set(-bodyLength * 0.05, bodyRadius * 0.7, 0);
        belly.castShadow = true;
        belly.receiveShadow = true;
        group.add(belly);

        const wingGeo = new THREE.BoxGeometry(wingLength, bodyRadius * 0.25, wingSpan);
        const wing = new THREE.Mesh(wingGeo, tileMaterial);
        wing.position.set(-bodyLength * 0.05, bodyRadius + 0.15, 0);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);

        const wingTipGeo = new THREE.BoxGeometry(wingLength * 0.25, bodyRadius * 0.18, wingSpan * 1.05);
        const wingTip = new THREE.Mesh(wingTipGeo, panelMaterial);
        wingTip.position.set(-bodyLength * 0.15, bodyRadius + 0.1, 0);
        wingTip.castShadow = true;
        wingTip.receiveShadow = true;
        group.add(wingTip);

        const tailGeo = new THREE.BoxGeometry(bodyRadius * 0.35, tailHeight, bodyRadius * 1.4);
        const tail = new THREE.Mesh(tailGeo, tileMaterial);
        tail.position.set(-bodyLength / 2 + bodyRadius * 0.2, bodyRadius + tailHeight * 0.6, 0);
        tail.castShadow = true;
        tail.receiveShadow = true;
        group.add(tail);

        const finGeo = new THREE.BoxGeometry(bodyRadius * 0.5, tailHeight * 1.1, bodyRadius * 0.12);
        const fin = new THREE.Mesh(finGeo, panelMaterial);
        fin.position.set(-bodyLength / 2 + bodyRadius * 0.15, bodyRadius + tailHeight * 1.2, 0);
        fin.castShadow = true;
        group.add(fin);

        const boosterGroup = new THREE.Group();
        boosterGroup.position.set(-bodyLength / 2 + bodyRadius * 0.35, bodyRadius + 0.4, 0);
        group.add(boosterGroup);

        const boosterGeo = new THREE.CylinderGeometry(bodyRadius * 0.35, bodyRadius * 0.35, bodyLength * 0.45, 14, 1);
        boosterGeo.rotateZ(Math.PI / 2);
        const boosterOffset = bodyRadius * 0.85;

        [-1, 0, 1].forEach((offset) => {
            const booster = new THREE.Mesh(boosterGeo, engineMaterial);
            booster.position.set(0, -bodyRadius * 0.2, offset * boosterOffset);
            booster.castShadow = true;
            boosterGroup.add(booster);

            const nozzleGeo = new THREE.ConeGeometry(bodyRadius * 0.28, bodyRadius * 0.5, 12);
            nozzleGeo.rotateZ(-Math.PI / 2);
            const nozzle = new THREE.Mesh(nozzleGeo, this.engineGlowMaterial);
            nozzle.position.set(-bodyLength * 0.23, -bodyRadius * 0.2, offset * boosterOffset);
            nozzle.castShadow = true;
            boosterGroup.add(nozzle);
        });

        const stabilizerGeo = new THREE.BoxGeometry(bodyRadius * 0.2, bodyRadius * 0.25, wingSpan * 0.45);
        const stabilizer = new THREE.Mesh(stabilizerGeo, panelMaterial);
        stabilizer.position.set(bodyLength * 0.25, bodyRadius * 0.95, 0);
        stabilizer.castShadow = true;
        stabilizer.receiveShadow = true;
        group.add(stabilizer);

        return group;
    }

    update(dt) {
        if (!this.mesh || !this.engineGlowMaterial) return;

        this.time += dt;
        const pulse = (Math.sin(this.time * this.enginePulseSpeed) + 1) * 0.5;
        this.engineGlowMaterial.emissiveIntensity = 0.8 + pulse * this.enginePulseStrength;
    }
}

EntityRegistry.register('spaceShuttle', SpaceShuttleEntity);
