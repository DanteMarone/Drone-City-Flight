import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const createLaunchPadTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2a2f34';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#d0d7df';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(128, 128);
    for (let i = 0; i < 12; i += 1) {
        ctx.rotate((Math.PI * 2) / 12);
        ctx.fillStyle = i % 2 === 0 ? '#ffcc33' : '#111111';
        ctx.fillRect(70, -8, 36, 16);
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(122, 80, 12, 96);
    ctx.fillRect(80, 122, 96, 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

export class LaunchTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'launchTower';
        this.time = Math.random() * 100;
        this.armSpeed = params.armSpeed || 0.7;
        this.beaconSpeed = params.beaconSpeed || 1.4;
    }

    static get displayName() { return 'Launch Tower'; }

    createMesh(params) {
        const padRadius = params.padRadius || 6;
        const padHeight = params.padHeight || 0.6;
        const towerHeight = params.towerHeight || 18;
        const towerWidth = params.towerWidth || 3;
        const towerDepth = params.towerDepth || 2.4;

        this.params.padRadius = padRadius;
        this.params.padHeight = padHeight;
        this.params.towerHeight = towerHeight;
        this.params.towerWidth = towerWidth;
        this.params.towerDepth = towerDepth;

        const group = new THREE.Group();

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            roughness: 0.9
        });

        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x6e7c86,
            roughness: 0.5,
            metalness: 0.6
        });

        const darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x2c3338,
            roughness: 0.7,
            metalness: 0.4
        });

        const hazardMat = new THREE.MeshStandardMaterial({
            map: createLaunchPadTexture(),
            roughness: 0.6,
            metalness: 0.2
        });

        const padGeo = new THREE.CylinderGeometry(padRadius * 1.08, padRadius * 1.12, padHeight, 28);
        const pad = new THREE.Mesh(padGeo, concreteMat);
        pad.position.y = padHeight / 2;
        pad.castShadow = true;
        pad.receiveShadow = true;
        group.add(pad);

        const padTopGeo = new THREE.CircleGeometry(padRadius * 0.95, 32);
        const padTop = new THREE.Mesh(padTopGeo, hazardMat);
        padTop.rotation.x = -Math.PI / 2;
        padTop.position.y = padHeight + 0.02;
        padTop.receiveShadow = true;
        group.add(padTop);

        const towerGroup = new THREE.Group();
        const towerOffsetX = padRadius * 0.35;
        towerGroup.position.set(towerOffsetX, padHeight, 0);
        group.add(towerGroup);

        const coreGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
        const towerCore = new THREE.Mesh(coreGeo, steelMat);
        towerCore.position.y = towerHeight / 2;
        towerCore.castShadow = true;
        towerCore.receiveShadow = true;
        towerGroup.add(towerCore);

        const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, towerHeight, 8);
        const beamPositions = [
            [towerWidth * 0.45, towerHeight / 2, towerDepth * 0.45],
            [-towerWidth * 0.45, towerHeight / 2, towerDepth * 0.45],
            [towerWidth * 0.45, towerHeight / 2, -towerDepth * 0.45],
            [-towerWidth * 0.45, towerHeight / 2, -towerDepth * 0.45]
        ];

        beamPositions.forEach((pos) => {
            const beam = new THREE.Mesh(beamGeo, darkSteelMat);
            beam.position.set(pos[0], pos[1], pos[2]);
            beam.castShadow = true;
            towerGroup.add(beam);
        });

        const platformGeo = new THREE.BoxGeometry(towerWidth * 1.4, 0.4, towerDepth * 1.5);
        const platform = new THREE.Mesh(platformGeo, darkSteelMat);
        platform.position.y = towerHeight * 0.6;
        platform.castShadow = true;
        platform.receiveShadow = true;
        towerGroup.add(platform);

        const platformRailGeo = new THREE.BoxGeometry(towerWidth * 1.4, 0.2, 0.2);
        const rail = new THREE.Mesh(platformRailGeo, steelMat);
        rail.position.set(0, towerHeight * 0.6 + 0.4, towerDepth * 0.75);
        rail.castShadow = true;
        towerGroup.add(rail);

        this.armPivot = new THREE.Group();
        this.armPivot.position.set(towerOffsetX, padHeight + towerHeight * 0.72, 0);
        group.add(this.armPivot);

        const armGeo = new THREE.BoxGeometry(padRadius * 0.9, 0.45, 0.8);
        const arm = new THREE.Mesh(armGeo, steelMat);
        arm.position.x = padRadius * 0.45;
        arm.castShadow = true;
        arm.receiveShadow = true;
        this.armPivot.add(arm);

        const pipeGeo = new THREE.CylinderGeometry(0.18, 0.22, padRadius * 0.8, 10);
        pipeGeo.rotateZ(Math.PI / 2);
        const pipe = new THREE.Mesh(pipeGeo, darkSteelMat);
        pipe.position.set(padRadius * 0.45, -0.35, 0.35);
        pipe.castShadow = true;
        this.armPivot.add(pipe);

        const nozzleGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
        nozzleGeo.rotateZ(-Math.PI / 2);
        const nozzle = new THREE.Mesh(nozzleGeo, darkSteelMat);
        nozzle.position.set(padRadius * 0.9, -0.35, 0.35);
        nozzle.castShadow = true;
        this.armPivot.add(nozzle);

        this.beaconGroup = new THREE.Group();
        this.beaconGroup.position.set(towerOffsetX, padHeight + towerHeight + 0.6, 0);
        group.add(this.beaconGroup);

        const beaconBaseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.6, 12);
        const beaconBase = new THREE.Mesh(beaconBaseGeo, darkSteelMat);
        beaconBase.castShadow = true;
        this.beaconGroup.add(beaconBase);

        this.beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6633,
            emissive: 0xff4b1a,
            emissiveIntensity: 1.2,
            roughness: 0.3
        });

        const beaconGeo = new THREE.BoxGeometry(0.8, 0.25, 0.2);
        const beaconPanel = new THREE.Mesh(beaconGeo, this.beaconMaterial);
        beaconPanel.position.y = 0.35;
        this.beaconGroup.add(beaconPanel);

        const beaconPanelTwo = new THREE.Mesh(beaconGeo, this.beaconMaterial);
        beaconPanelTwo.position.y = 0.35;
        beaconPanelTwo.rotation.y = Math.PI / 2;
        this.beaconGroup.add(beaconPanelTwo);

        const antennaGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
        const antenna = new THREE.Mesh(antennaGeo, steelMat);
        antenna.position.y = 1.7;
        antenna.castShadow = true;
        this.beaconGroup.add(antenna);

        const antennaTipGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const antennaTip = new THREE.Mesh(antennaTipGeo, this.beaconMaterial);
        antennaTip.position.y = 3.1;
        this.beaconGroup.add(antennaTip);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.time += dt;

        if (this.armPivot) {
            const sway = Math.sin(this.time * this.armSpeed) * 0.25 + 0.35;
            this.armPivot.rotation.y = sway;
        }

        if (this.beaconGroup) {
            this.beaconGroup.rotation.y += this.beaconSpeed * dt;
        }

        if (this.beaconMaterial) {
            this.beaconMaterial.emissiveIntensity = 1.2 + Math.sin(this.time * 3) * 0.6;
        }
    }
}

EntityRegistry.register('launchTower', LaunchTowerEntity);
