import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const PASTEL_WALLS = ['#9ad6f5', '#8ed1c4', '#f3d196', '#f2b6a0'];

export class LifeguardTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'lifeguardTower';
        this._time = Math.random() * Math.PI * 2;
        this._flag = null;
        this._glowMaterial = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._flagBase = new THREE.Vector3();
    }

    static get displayName() { return 'Lifeguard Tower'; }

    createMesh(params) {
        const group = new THREE.Group();
        const deckWidth = params.deckWidth || 3.2;
        const deckDepth = params.deckDepth || 2.4;
        const platformHeight = params.platformHeight || 3.2;
        const cabinHeight = params.cabinHeight || 1.5;
        const accentColor = params.accentColor || 0xff7b57;
        const wallColor = params.wallColor || PASTEL_WALLS[Math.floor(Math.random() * PASTEL_WALLS.length)];

        const sandTex = TextureGenerator.createSand();
        sandTex.wrapS = THREE.RepeatWrapping;
        sandTex.wrapT = THREE.RepeatWrapping;
        sandTex.repeat.set(2, 2);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0xc1875a, roughness: 0.75, metalness: 0.05 });
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x6f4b2a, roughness: 0.8 });
        const wallTex = TextureGenerator.createBuildingFacade({
            color: wallColor,
            windowColor: '#dff7ff',
            floors: 2,
            cols: 3,
            width: 256,
            height: 256
        });
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.55, metalness: 0.05 });

        // Stilts
        const stiltGeo = new THREE.CylinderGeometry(0.14, 0.16, platformHeight, 8);
        const stiltPositions = [
            [-deckWidth / 2 + 0.3, platformHeight / 2, -deckDepth / 2 + 0.3],
            [deckWidth / 2 - 0.3, platformHeight / 2, -deckDepth / 2 + 0.3],
            [-deckWidth / 2 + 0.3, platformHeight / 2, deckDepth / 2 - 0.3],
            [deckWidth / 2 - 0.3, platformHeight / 2, deckDepth / 2 - 0.3]
        ];
        stiltPositions.forEach(pos => {
            const stilt = new THREE.Mesh(stiltGeo, frameMat);
            stilt.position.set(pos[0], pos[1], pos[2]);
            stilt.castShadow = true;
            stilt.receiveShadow = true;
            group.add(stilt);
        });

        // Cross braces
        const braceGeo = new THREE.BoxGeometry(deckWidth - 0.8, 0.08, 0.18);
        const brace1 = new THREE.Mesh(braceGeo, frameMat);
        brace1.position.set(0, platformHeight * 0.35, -deckDepth / 2 + 0.3);
        brace1.rotation.z = Math.PI / 12;
        group.add(brace1);

        const brace2 = brace1.clone();
        brace2.rotation.z = -Math.PI / 12;
        brace2.position.z = deckDepth / 2 - 0.3;
        group.add(brace2);

        // Deck
        const deckGeo = new THREE.BoxGeometry(deckWidth, 0.18, deckDepth);
        const deckMat = new THREE.MeshStandardMaterial({
            map: sandTex,
            color: 0xe5c299,
            roughness: 0.8,
            metalness: 0.05
        });
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.y = platformHeight + deckGeo.parameters.height / 2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(deckWidth * 0.8, cabinHeight, deckDepth * 0.7);
        const cabin = new THREE.Mesh(cabinGeo, wallMat);
        cabin.position.set(0, deck.position.y + cabinHeight / 2 + 0.02, -deckDepth * 0.05);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        // Roof
        const roofGeo = new THREE.BoxGeometry(deckWidth * 0.95, 0.12, deckDepth * 0.9);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f3b4c, roughness: 0.35, metalness: 0.55 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, cabin.position.y + cabinHeight / 2 + 0.12, cabin.position.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // Railings
        const railHeight = 0.8;
        const railGeo = new THREE.BoxGeometry(deckWidth, 0.08, 0.08);
        const railPositions = [
            [0, deck.position.y + railHeight, -deckDepth / 2 + 0.04],
            [0, deck.position.y + railHeight, deckDepth / 2 - 0.04]
        ];
        railPositions.forEach(([x, y, z]) => {
            const rail = new THREE.Mesh(railGeo, frameMat);
            rail.position.set(x, y, z);
            rail.castShadow = true;
            group.add(rail);
        });

        const postGeo = new THREE.BoxGeometry(0.08, railHeight, 0.08);
        for (let i = -3; i <= 3; i++) {
            const postFront = new THREE.Mesh(postGeo, frameMat);
            postFront.position.set((i / 3) * (deckWidth / 2 - 0.15), deck.position.y + railHeight / 2, -deckDepth / 2 + 0.04);
            postFront.castShadow = true;
            group.add(postFront);

            const postBack = postFront.clone();
            postBack.position.z = deckDepth / 2 - 0.04;
            group.add(postBack);
        }

        // Access ramp
        const rampLength = deckWidth * 0.9;
        const rampGeo = new THREE.BoxGeometry(rampLength, 0.12, 0.9);
        const ramp = new THREE.Mesh(rampGeo, deckMat);
        ramp.position.set(0, deck.position.y - 0.45, deckDepth / 2 + rampGeo.parameters.depth / 2 - 0.05);
        ramp.rotation.x = -Math.PI / 9;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        group.add(ramp);

        // Ramp steps
        const stepGeo = new THREE.BoxGeometry(0.14, 0.06, 0.8);
        for (let i = 0; i < 6; i++) {
            const step = new THREE.Mesh(stepGeo, woodMat);
            const t = i / 5;
            step.position.set(
                -rampLength / 2 + 0.2 + t * (rampLength - 0.4),
                ramp.position.y + 0.06 + t * 0.4,
                ramp.position.z + 0.02
            );
            step.castShadow = true;
            step.rotation.x = ramp.rotation.x;
            group.add(step);
        }

        // Beacon
        const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.6
        });
        const beacon = new THREE.Mesh(beaconGeo, this._glowMaterial);
        beacon.position.set(deckWidth / 2 - 0.35, roof.position.y + 0.22, cabin.position.z);
        beacon.castShadow = true;
        group.add(beacon);
        this._lightAnchor.copy(beacon.position);

        // Flag
        const flagGeo = new THREE.PlaneGeometry(0.7, 0.45, 8, 2);
        const flagMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.1
        });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(-deckWidth / 2 - 0.05, roof.position.y + 0.45, cabin.position.z);
        flag.rotation.y = Math.PI / 2;
        flag.castShadow = true;
        group.add(flag);
        this._flag = flag;
        this._flagBase.copy(flag.position);

        // Flag pole
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const pole = new THREE.Mesh(poleGeo, frameMat);
        pole.position.set(flag.position.x, roof.position.y + 0.2, cabin.position.z);
        pole.castShadow = true;
        group.add(pole);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, this._glowMaterial?.color?.getHex() || 0xffc074, 1.6, 16);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const breeze = Math.sin(this._time * 1.5) * 0.08 + Math.sin(this._time * 0.4) * 0.05;
        if (this._flag) {
            this._flag.rotation.z = breeze * 0.9;
            this._flag.position.copy(this._flagBase);
            this._flag.position.x += Math.sin(this._time * 0.5) * 0.06;
        }

        if (this._glowMaterial) {
            const pulse = 0.6 + Math.sin(this._time * 3.2) * 0.25;
            this._glowMaterial.emissiveIntensity = pulse;
        }

        if (this._lightHandle) {
            const base = 1.3;
            this._lightHandle.intensity = base + Math.sin(this._time * 2.8) * 0.4;
        }
    }
}

EntityRegistry.register('lifeguardTower', LifeguardTowerEntity);
