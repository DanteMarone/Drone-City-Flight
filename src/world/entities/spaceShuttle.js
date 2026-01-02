import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createShuttleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f2f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#3b3f45';
    for (let i = 0; i < 6; i += 1) {
        ctx.fillRect(0, 30 + i * 38, canvas.width, 6);
    }

    ctx.fillStyle = '#101418';
    for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(28 + i * 40, 90, 22, 46);
        ctx.fillRect(28 + i * 40, 150, 22, 46);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let i = 0; i < 120; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export class SpaceShuttleEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'spaceShuttle';
        this.enginePulse = 0;
        this.engineMaterials = [];
    }

    static get displayName() { return 'Space Shuttle'; }

    createMesh(params) {
        const length = params.length || 8.5;
        const bodyRadius = params.bodyRadius || 1.1;
        const wingSpan = params.wingSpan || 5.4;

        this.params.length = length;
        this.params.bodyRadius = bodyRadius;
        this.params.wingSpan = wingSpan;

        const group = new THREE.Group();

        const hullMaterial = new THREE.MeshStandardMaterial({
            map: createShuttleTexture(),
            roughness: 0.6,
            metalness: 0.2
        });

        const darkMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b2f36,
            roughness: 0.8
        });

        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x1b2733,
            metalness: 0.4,
            roughness: 0.2
        });

        const bodyGeo = new THREE.CylinderGeometry(bodyRadius * 0.95, bodyRadius, length, 24, 1, false);
        bodyGeo.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, hullMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const noseGeo = new THREE.ConeGeometry(bodyRadius * 0.9, length * 0.18, 24);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, hullMaterial);
        nose.position.z = length * 0.5 + length * 0.09;
        nose.castShadow = true;
        group.add(nose);

        const cockpitGeo = new THREE.SphereGeometry(bodyRadius * 0.55, 16, 12);
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMaterial);
        cockpit.scale.set(1, 0.7, 1.1);
        cockpit.position.set(0, bodyRadius * 0.35, length * 0.18);
        cockpit.castShadow = true;
        group.add(cockpit);

        const wingGeo = new THREE.BoxGeometry(wingSpan, 0.2, length * 0.35);
        const wings = new THREE.Mesh(wingGeo, hullMaterial);
        wings.position.set(0, -bodyRadius * 0.2, -length * 0.05);
        wings.castShadow = true;
        wings.receiveShadow = true;
        group.add(wings);

        const wingTipGeo = new THREE.BoxGeometry(wingSpan * 0.18, 0.12, length * 0.2);
        [-1, 1].forEach((side) => {
            const wingTip = new THREE.Mesh(wingTipGeo, darkMaterial);
            wingTip.position.set(side * wingSpan * 0.5, -bodyRadius * 0.16, -length * 0.08);
            wingTip.rotation.z = side * 0.15;
            wingTip.castShadow = true;
            group.add(wingTip);
        });

        const tailGeo = new THREE.BoxGeometry(bodyRadius * 0.6, length * 0.22, bodyRadius * 0.2);
        const tail = new THREE.Mesh(tailGeo, darkMaterial);
        tail.position.set(0, bodyRadius * 0.5, -length * 0.36);
        tail.castShadow = true;
        group.add(tail);

        const tailFinGeo = new THREE.BoxGeometry(bodyRadius * 0.4, length * 0.3, bodyRadius * 0.12);
        const tailFin = new THREE.Mesh(tailFinGeo, darkMaterial);
        tailFin.position.set(0, bodyRadius * 1.05, -length * 0.32);
        tailFin.castShadow = true;
        group.add(tailFin);

        const engineGlowMat = new THREE.MeshStandardMaterial({
            color: 0x33b3ff,
            emissive: 0x2f7fff,
            emissiveIntensity: 1.4,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85
        });

        const engineShellMat = new THREE.MeshStandardMaterial({
            color: 0x5e646d,
            roughness: 0.7,
            metalness: 0.3
        });

        const engineGeo = new THREE.CylinderGeometry(bodyRadius * 0.22, bodyRadius * 0.26, bodyRadius * 0.6, 12);
        engineGeo.rotateX(Math.PI / 2);
        const engineGlowGeo = new THREE.CylinderGeometry(bodyRadius * 0.18, bodyRadius * 0.12, bodyRadius * 0.45, 12);
        engineGlowGeo.rotateX(Math.PI / 2);

        [-0.35, 0, 0.35].forEach((offsetX) => {
            const engine = new THREE.Mesh(engineGeo, engineShellMat);
            engine.position.set(offsetX, -bodyRadius * 0.15, -length * 0.48);
            engine.castShadow = true;
            group.add(engine);

            const glow = new THREE.Mesh(engineGlowGeo, engineGlowMat.clone());
            glow.position.set(offsetX, -bodyRadius * 0.15, -length * 0.52);
            glow.castShadow = true;
            group.add(glow);
            this.engineMaterials.push(glow.material);
        });

        const boosterGeo = new THREE.CylinderGeometry(bodyRadius * 0.18, bodyRadius * 0.18, length * 0.65, 16);
        boosterGeo.rotateX(Math.PI / 2);
        const booster = new THREE.Mesh(boosterGeo, darkMaterial);
        booster.position.set(bodyRadius * 1.2, -bodyRadius * 0.2, -length * 0.1);
        booster.castShadow = true;
        booster.receiveShadow = true;
        group.add(booster);

        const boosterTwo = booster.clone();
        boosterTwo.position.x = -bodyRadius * 1.2;
        group.add(boosterTwo);

        return group;
    }

    update(dt) {
        this.enginePulse += dt * 2.5;
        const intensity = 1.1 + Math.sin(this.enginePulse) * 0.6;
        this.engineMaterials.forEach((material) => {
            material.emissiveIntensity = intensity;
        });
    }
}

EntityRegistry.register('spaceShuttle', SpaceShuttleEntity);
