import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createThermalTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d9d9db';
    ctx.fillRect(0, 0, 256, 256);

    const tileSize = 16;
    for (let y = 0; y < 256; y += tileSize) {
        for (let x = 0; x < 256; x += tileSize) {
            const shade = 40 + Math.random() * 30;
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            if (Math.random() > 0.25) {
                ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
            }
        }
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 256; i += tileSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
};

export class SpaceShuttleEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'spaceShuttle';
        this.time = Math.random() * 100;
        this.enginePulseSpeed = params.enginePulseSpeed || 3.2;
        this.engineMaterials = [];
    }

    static get displayName() { return 'Space Shuttle'; }

    createMesh(params) {
        const length = params.length || 18;
        const fuselageRadius = params.fuselageRadius || 1.4;
        const wingSpan = params.wingSpan || 9;
        const finHeight = params.finHeight || 3.4;
        const boosterLength = params.boosterLength || 12;

        this.params.length = length;
        this.params.fuselageRadius = fuselageRadius;
        this.params.wingSpan = wingSpan;
        this.params.finHeight = finHeight;
        this.params.boosterLength = boosterLength;

        const group = new THREE.Group();

        const tileTexture = createThermalTileTexture();

        const fuselageMat = new THREE.MeshStandardMaterial({
            color: 0xf1f1f1,
            roughness: 0.6,
            metalness: 0.1,
            map: tileTexture
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x2b2f36,
            roughness: 0.7,
            metalness: 0.1
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xb3542b,
            roughness: 0.6,
            metalness: 0.2
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x24455f,
            roughness: 0.2,
            metalness: 0.3,
            emissive: 0x1f4a66,
            emissiveIntensity: 0.6
        });

        const fuselageGeo = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.95, length, 20, 1, false);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselage.position.y = fuselageRadius + 0.6;
        fuselage.castShadow = true;
        fuselage.receiveShadow = true;
        group.add(fuselage);

        const noseLength = length * 0.22;
        const noseGeo = new THREE.ConeGeometry(fuselageRadius * 0.95, noseLength, 18);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, fuselageMat);
        nose.position.set(0, fuselageRadius + 0.6, length / 2 + noseLength * 0.5);
        nose.castShadow = true;
        group.add(nose);

        const cockpitGeo = new THREE.BoxGeometry(fuselageRadius * 1.2, fuselageRadius * 0.6, length * 0.18);
        const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
        cockpit.position.set(0, fuselageRadius * 1.35, length * 0.28);
        cockpit.castShadow = true;
        group.add(cockpit);

        const wingGeo = new THREE.BoxGeometry(wingSpan * 0.5, 0.25, length * 0.4);
        const leftWing = new THREE.Mesh(wingGeo, darkMat);
        leftWing.position.set(-wingSpan * 0.25, fuselageRadius + 0.25, -length * 0.05);
        leftWing.rotation.y = Math.PI / 12;
        leftWing.castShadow = true;
        leftWing.receiveShadow = true;
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, darkMat);
        rightWing.position.set(wingSpan * 0.25, fuselageRadius + 0.25, -length * 0.05);
        rightWing.rotation.y = -Math.PI / 12;
        rightWing.castShadow = true;
        rightWing.receiveShadow = true;
        group.add(rightWing);

        const tailFinGeo = new THREE.BoxGeometry(0.3, finHeight, length * 0.16);
        const tailFin = new THREE.Mesh(tailFinGeo, darkMat);
        tailFin.position.set(0, fuselageRadius + finHeight * 0.5, -length * 0.25);
        tailFin.castShadow = true;
        group.add(tailFin);

        const engineDeckGeo = new THREE.BoxGeometry(fuselageRadius * 1.4, 0.35, length * 0.22);
        const engineDeck = new THREE.Mesh(engineDeckGeo, accentMat);
        engineDeck.position.set(0, fuselageRadius + 0.35, -length * 0.33);
        engineDeck.castShadow = true;
        engineDeck.receiveShadow = true;
        group.add(engineDeck);

        const boosterGeo = new THREE.CylinderGeometry(fuselageRadius * 0.35, fuselageRadius * 0.35, boosterLength, 14);
        boosterGeo.rotateX(Math.PI / 2);
        const leftBooster = new THREE.Mesh(boosterGeo, accentMat);
        leftBooster.position.set(-fuselageRadius * 1.1, fuselageRadius * 0.75, -length * 0.15);
        leftBooster.castShadow = true;
        leftBooster.receiveShadow = true;
        group.add(leftBooster);

        const rightBooster = new THREE.Mesh(boosterGeo, accentMat);
        rightBooster.position.set(fuselageRadius * 1.1, fuselageRadius * 0.75, -length * 0.15);
        rightBooster.castShadow = true;
        rightBooster.receiveShadow = true;
        group.add(rightBooster);

        const engineGlowMat = new THREE.MeshStandardMaterial({
            color: 0xffa54d,
            emissive: 0xff7a1a,
            emissiveIntensity: 1.5,
            roughness: 0.4
        });
        this.engineMaterials.push(engineGlowMat);

        const engineGeo = new THREE.CylinderGeometry(fuselageRadius * 0.35, fuselageRadius * 0.45, 0.8, 16);
        engineGeo.rotateX(Math.PI / 2);
        const engine = new THREE.Mesh(engineGeo, engineGlowMat);
        engine.position.set(0, fuselageRadius + 0.35, -length * 0.5);
        engine.castShadow = true;
        group.add(engine);

        const nozzleGeo = new THREE.ConeGeometry(fuselageRadius * 0.28, 0.7, 14);
        nozzleGeo.rotateX(-Math.PI / 2);
        const nozzleLeft = new THREE.Mesh(nozzleGeo, engineGlowMat);
        nozzleLeft.position.set(-fuselageRadius * 0.6, fuselageRadius * 0.55, -length * 0.5);
        group.add(nozzleLeft);

        const nozzleRight = new THREE.Mesh(nozzleGeo, engineGlowMat);
        nozzleRight.position.set(fuselageRadius * 0.6, fuselageRadius * 0.55, -length * 0.5);
        group.add(nozzleRight);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this.time += dt;
        const pulse = (Math.sin(this.time * this.enginePulseSpeed) + 1) * 0.6 + 0.6;
        this.engineMaterials.forEach((material) => {
            material.emissiveIntensity = pulse;
        });
    }
}

EntityRegistry.register('spaceShuttle', SpaceShuttleEntity);
