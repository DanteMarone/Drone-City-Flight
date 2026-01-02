import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);

const createRivetedMetalTexture = (options = {}) => {
    const {
        baseColor = '#5f7680',
        bandColor = '#6e8792',
        rivetColor = '#2f3a40',
        width = 256,
        height = 256
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    const bandCount = 4;
    const bandHeight = Math.floor(height / (bandCount * 2));
    ctx.fillStyle = bandColor;
    for (let i = 0; i < bandCount; i++) {
        const y = Math.floor((i * 2 + 1) * bandHeight);
        ctx.fillRect(0, y, width, bandHeight);
    }

    ctx.fillStyle = rivetColor;
    const rows = 6;
    const cols = 12;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = (col + 0.5) * (width / cols);
            const y = (row + 0.5) * (height / rows);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
};

export class RooftopWaterTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'rooftopWaterTower';
        this.rotor = null;
        this.beaconMaterial = null;
        this.time = Math.random() * 10;
    }

    static get displayName() { return 'Rooftop Water Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseSize = params.baseSize || 3.4;
        const legHeight = params.legHeight || 3.6;
        const tankRadius = params.tankRadius || 1.7;
        const tankHeight = params.tankHeight || 2.6;

        this.params.baseSize = baseSize;
        this.params.legHeight = legHeight;
        this.params.tankRadius = tankRadius;
        this.params.tankHeight = tankHeight;

        const metalPalette = ['#5f7680', '#6c7f73', '#6e5a58', '#5a6b7a'];
        const baseColor = metalPalette[Math.floor(Math.random() * metalPalette.length)];

        const tankTexture = createRivetedMetalTexture({ baseColor });
        const tankMat = new THREE.MeshStandardMaterial({
            map: tankTexture,
            roughness: 0.6,
            metalness: 0.35
        });

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x3d4348,
            roughness: 0.8,
            metalness: 0.2
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x9098a0,
            roughness: 0.5,
            metalness: 0.6
        });

        const platformGeo = new THREE.BoxGeometry(baseSize, 0.25, baseSize);
        const platform = new THREE.Mesh(platformGeo, frameMat);
        platform.position.set(0, legHeight + 0.2, 0);
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);

        const legOffset = baseSize * 0.45;
        const legGeo = new THREE.BoxGeometry(0.25, legHeight, 0.25);
        const legPositions = [
            [legOffset, legHeight / 2, legOffset],
            [-legOffset, legHeight / 2, legOffset],
            [legOffset, legHeight / 2, -legOffset],
            [-legOffset, legHeight / 2, -legOffset]
        ];

        legPositions.forEach(([x, y, z]) => {
            const leg = new THREE.Mesh(legGeo, frameMat);
            leg.position.set(x, y, z);
            leg.castShadow = true;
            group.add(leg);
        });

        const braceGeo = new THREE.BoxGeometry(baseSize * 0.9, 0.12, 0.12);
        const braceHeights = [legHeight * 0.35, legHeight * 0.7];
        braceHeights.forEach((y) => {
            const braceFront = new THREE.Mesh(braceGeo, frameMat);
            braceFront.position.set(0, y, legOffset);
            group.add(braceFront);

            const braceBack = braceFront.clone();
            braceBack.position.z = -legOffset;
            group.add(braceBack);

            const braceSide = new THREE.Mesh(braceGeo, frameMat);
            braceSide.rotation.y = Math.PI / 2;
            braceSide.position.set(legOffset, y, 0);
            group.add(braceSide);

            const braceSideBack = braceSide.clone();
            braceSideBack.position.x = -legOffset;
            group.add(braceSideBack);
        });

        const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 20);
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, legHeight + 0.2 + tankHeight / 2, 0);
        tank.castShadow = true;
        tank.receiveShadow = true;
        group.add(tank);

        const domeGeo = new THREE.SphereGeometry(tankRadius * 0.98, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, tankMat);
        dome.position.set(0, legHeight + 0.2 + tankHeight, 0);
        dome.castShadow = true;
        group.add(dome);

        const bandGeo = new THREE.TorusGeometry(tankRadius * 1.01, 0.08, 8, 24);
        const bandTop = new THREE.Mesh(bandGeo, accentMat);
        bandTop.rotation.x = Math.PI / 2;
        bandTop.position.set(0, legHeight + 0.2 + tankHeight * 0.4, 0);
        group.add(bandTop);

        const bandBottom = bandTop.clone();
        bandBottom.position.y = legHeight + 0.2 + tankHeight * 0.75;
        group.add(bandBottom);

        const hatchGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
        const hatch = new THREE.Mesh(hatchGeo, accentMat);
        hatch.position.set(tankRadius * 0.3, legHeight + 0.2 + tankHeight + 0.15, 0);
        group.add(hatch);

        const rotorGroup = new THREE.Group();
        const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10);
        const hub = new THREE.Mesh(hubGeo, accentMat);
        hub.rotation.x = Math.PI / 2;
        rotorGroup.add(hub);

        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(boxGeo, accentMat);
            blade.scale.set(0.08, 0.02, 0.5);
            blade.position.set(0, 0, 0.25);
            blade.rotation.y = (Math.PI / 2) * i;
            rotorGroup.add(blade);
        }

        rotorGroup.position.set(0, legHeight + 0.2 + tankHeight + 0.32, 0);
        group.add(rotorGroup);
        this.rotor = rotorGroup;

        const ladderGroup = new THREE.Group();
        const ladderRailGeo = new THREE.BoxGeometry(0.06, tankHeight * 0.9, 0.06);
        const ladderRailLeft = new THREE.Mesh(ladderRailGeo, frameMat);
        ladderRailLeft.position.set(0.18, tankHeight * 0.45, 0.02);
        ladderGroup.add(ladderRailLeft);

        const ladderRailRight = ladderRailLeft.clone();
        ladderRailRight.position.x = -0.18;
        ladderGroup.add(ladderRailRight);

        const rungGeo = new THREE.BoxGeometry(0.36, 0.04, 0.04);
        for (let i = 0; i < 6; i++) {
            const rung = new THREE.Mesh(rungGeo, frameMat);
            rung.position.set(0, 0.2 + i * 0.35, 0.02);
            ladderGroup.add(rung);
        }

        ladderGroup.position.set(tankRadius + 0.1, legHeight + 0.2, 0);
        group.add(ladderGroup);

        const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, tankRadius * 1.2, 10);
        const pipe = new THREE.Mesh(pipeGeo, accentMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(-tankRadius * 0.8, legHeight + 0.2 + tankHeight * 0.2, 0);
        group.add(pipe);

        const elbowGeo = new THREE.TorusGeometry(0.18, 0.07, 8, 16, Math.PI / 2);
        const elbow = new THREE.Mesh(elbowGeo, accentMat);
        elbow.rotation.z = Math.PI / 2;
        elbow.position.set(-tankRadius * 1.4, legHeight + 0.2 + tankHeight * 0.2, 0);
        group.add(elbow);

        const beaconGeo = new THREE.SphereGeometry(0.12, 12, 10);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xff8844,
            emissive: 0xff5522,
            emissiveIntensity: 0.8
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, legHeight + 0.2 + tankHeight + 0.55, 0);
        group.add(beacon);
        this.beaconMaterial = beaconMat;

        return group;
    }

    update(dt) {
        this.time += dt;

        if (this.rotor) {
            this.rotor.rotation.y += dt * 1.8;
        }

        if (this.beaconMaterial) {
            const pulse = 0.6 + Math.sin(this.time * 3.2) * 0.5;
            this.beaconMaterial.emissiveIntensity = pulse;
        }
    }
}

EntityRegistry.register('rooftopWaterTower', RooftopWaterTowerEntity);
