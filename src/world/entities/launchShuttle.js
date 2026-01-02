import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createThermalTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e9ecef';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#cfd4da';
    const tileSize = 18;
    const grout = 2;
    for (let y = 0; y < 256; y += tileSize) {
        for (let x = 0; x < 256; x += tileSize) {
            ctx.fillRect(x + grout, y + grout, tileSize - grout * 2, tileSize - grout * 2);
        }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 2200; i += 1) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
};

export class LaunchShuttleEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'launchShuttle';
        this.thrusterMaterials = [];
        this.thrusterGlows = [];
        this.elapsed = Math.random() * 10;
    }

    static get displayName() { return 'Launch Space Shuttle'; }

    createMesh(params) {
        const length = params.length || 14;
        const bodyRadius = params.bodyRadius || 1.4;
        const wingSpan = params.wingSpan || 6.2;
        const tailHeight = params.tailHeight || 4.2;
        const tankRadius = params.tankRadius || 1.8;
        const boosterRadius = params.boosterRadius || 0.7;

        this.params.length = length;
        this.params.bodyRadius = bodyRadius;
        this.params.wingSpan = wingSpan;
        this.params.tailHeight = tailHeight;
        this.params.tankRadius = tankRadius;
        this.params.boosterRadius = boosterRadius;

        const group = new THREE.Group();
        const baseHeight = bodyRadius + 0.45;

        const tileMat = new THREE.MeshStandardMaterial({
            map: createThermalTileTexture(),
            roughness: 0.7,
            metalness: 0.2
        });

        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xf5f7fa,
            roughness: 0.55,
            metalness: 0.25
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x23272b,
            roughness: 0.8,
            metalness: 0.1
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x5fc1ff,
            emissive: 0x1f5b85,
            emissiveIntensity: 0.6,
            roughness: 0.15,
            metalness: 0.6,
            transparent: true,
            opacity: 0.8
        });

        const tankMat = new THREE.MeshStandardMaterial({
            color: 0xe07b39,
            roughness: 0.65,
            metalness: 0.2
        });

        const boosterMat = new THREE.MeshStandardMaterial({
            color: 0xdfe6ee,
            roughness: 0.6,
            metalness: 0.25
        });

        const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.92, length, 24);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, tileMat);
        fuselage.position.set(0, baseHeight, 0);
        fuselage.castShadow = true;
        fuselage.receiveShadow = true;
        group.add(fuselage);

        const noseGeo = new THREE.ConeGeometry(bodyRadius * 0.92, bodyRadius * 2.2, 24);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, whiteMat);
        nose.position.set(0, baseHeight, length / 2 + bodyRadius * 0.95);
        nose.castShadow = true;
        group.add(nose);

        const cockpit = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.65, 20, 16), glassMat);
        cockpit.position.set(0, baseHeight + bodyRadius * 0.35, length / 2 - bodyRadius * 1.3);
        cockpit.scale.set(1.2, 0.7, 1);
        cockpit.castShadow = true;
        group.add(cockpit);

        const wingGeo = new THREE.BoxGeometry(wingSpan, 0.25, bodyRadius * 2.4);
        const wing = new THREE.Mesh(wingGeo, whiteMat);
        wing.position.set(0, baseHeight - 0.1, -bodyRadius * 0.2);
        wing.castShadow = true;
        wing.receiveShadow = true;
        group.add(wing);

        const wingTipGeo = new THREE.BoxGeometry(wingSpan * 0.22, 0.22, bodyRadius * 1.1);
        const wingTipLeft = new THREE.Mesh(wingTipGeo, darkMat);
        wingTipLeft.position.set(-wingSpan * 0.48, baseHeight - 0.12, -bodyRadius * 0.2);
        wingTipLeft.rotation.y = Math.PI / 16;
        wingTipLeft.castShadow = true;
        group.add(wingTipLeft);

        const wingTipRight = wingTipLeft.clone();
        wingTipRight.position.x = wingSpan * 0.48;
        wingTipRight.rotation.y = -Math.PI / 16;
        group.add(wingTipRight);

        const tailGeo = new THREE.BoxGeometry(bodyRadius * 0.5, tailHeight, bodyRadius * 1.1);
        const tail = new THREE.Mesh(tailGeo, whiteMat);
        tail.position.set(0, baseHeight + tailHeight * 0.45, -length * 0.25);
        tail.castShadow = true;
        group.add(tail);

        const tailStripe = new THREE.Mesh(new THREE.BoxGeometry(bodyRadius * 0.52, tailHeight * 0.85, bodyRadius * 0.35), darkMat);
        tailStripe.position.set(0, baseHeight + tailHeight * 0.45, -length * 0.25 + bodyRadius * 0.35);
        group.add(tailStripe);

        const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius * 0.96, length * 0.9, 28);
        tankGeo.rotateX(Math.PI / 2);
        const externalTank = new THREE.Mesh(tankGeo, tankMat);
        externalTank.position.set(0, baseHeight - bodyRadius * 0.95, -bodyRadius * 0.6);
        externalTank.castShadow = true;
        externalTank.receiveShadow = true;
        group.add(externalTank);

        const boosterGeo = new THREE.CylinderGeometry(boosterRadius, boosterRadius * 0.95, length * 0.85, 20);
        boosterGeo.rotateX(Math.PI / 2);
        const boosterOffsets = [-tankRadius - boosterRadius * 0.95, tankRadius + boosterRadius * 0.95];
        boosterOffsets.forEach((offsetX) => {
            const booster = new THREE.Mesh(boosterGeo, boosterMat);
            booster.position.set(offsetX, baseHeight - bodyRadius * 0.95, -bodyRadius * 0.6);
            booster.castShadow = true;
            booster.receiveShadow = true;
            group.add(booster);

            const boosterNose = new THREE.Mesh(new THREE.ConeGeometry(boosterRadius * 0.95, boosterRadius * 2, 16), whiteMat);
            boosterNose.rotation.x = Math.PI / 2;
            boosterNose.position.set(offsetX, baseHeight - bodyRadius * 0.95, length * 0.4 - bodyRadius * 0.6);
            boosterNose.castShadow = true;
            group.add(boosterNose);
        });

        const engineGeo = new THREE.CylinderGeometry(0.28, 0.4, 0.9, 12);
        engineGeo.rotateX(Math.PI / 2);
        const enginePositions = [-0.55, 0, 0.55];
        enginePositions.forEach((offsetX, index) => {
            const engine = new THREE.Mesh(engineGeo, darkMat);
            engine.position.set(offsetX, baseHeight - 0.2, -length / 2 - 0.45);
            engine.castShadow = true;
            group.add(engine);

            const glowMat = new THREE.MeshStandardMaterial({
                color: 0xffa64d,
                emissive: 0xff7b1c,
                emissiveIntensity: 1.2,
                transparent: true,
                opacity: 0.85
            });
            this.thrusterMaterials.push(glowMat);

            const glowGeo = new THREE.ConeGeometry(0.25, 1.2, 16);
            glowGeo.rotateX(-Math.PI / 2);
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.set(offsetX, baseHeight - 0.2, -length / 2 - 1.1);
            glow.scale.z = 1.2;
            glow.castShadow = true;
            this.thrusterGlows.push(glow);
            group.add(glow);

            if (index === 1) {
                const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), glowMat);
                beacon.position.set(0, baseHeight + bodyRadius * 0.6, -length * 0.08);
                group.add(beacon);
            }
        });

        const gearGeo = new THREE.BoxGeometry(0.35, 0.35, 0.8);
        const gearPositions = [
            [-1, 0.18, bodyRadius * 1.1],
            [1, 0.18, bodyRadius * 1.1],
            [0, 0.18, -bodyRadius * 1.3]
        ];
        gearPositions.forEach((pos) => {
            const gear = new THREE.Mesh(gearGeo, darkMat);
            gear.position.set(pos[0], pos[1], pos[2]);
            gear.castShadow = true;
            group.add(gear);
        });

        return group;
    }

    update(dt) {
        this.elapsed += dt;
        const pulse = 0.9 + Math.sin(this.elapsed * 5) * 0.35;
        this.thrusterMaterials.forEach((mat, index) => {
            mat.emissiveIntensity = pulse + index * 0.05;
        });
        this.thrusterGlows.forEach((glow, index) => {
            const flutter = 1 + Math.sin(this.elapsed * 6 + index) * 0.08;
            glow.scale.set(1, 1, flutter);
        });
    }
}

EntityRegistry.register('launchShuttle', LaunchShuttleEntity);
