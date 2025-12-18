import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [0xffcc66, 0x74dfff, 0xff7f66, 0xa7ff70];

export class LifeguardTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'lifeguardTower';
        this._time = Math.random() * Math.PI * 2;
        this._beaconMaterial = null;
        this._virtualLight = null;
        this._lightLocalPos = null;
        this._flag = null;
    }

    static get displayName() { return 'Lifeguard Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const platformWidth = params.width || 3.4;
        const platformDepth = params.depth || 2.6;
        const deckHeight = params.deckHeight || 3.2;
        const deckThickness = 0.2;
        const cabinHeight = params.cabinHeight || 1.6;
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        // Materials
        const sandTex = TextureGenerator.createSand();
        sandTex.wrapS = THREE.RepeatWrapping;
        sandTex.wrapT = THREE.RepeatWrapping;
        sandTex.repeat.set(2, 2);

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0xcaa472,
            roughness: 0.72,
            metalness: 0.05,
            map: sandTex
        });

        const supportMat = new THREE.MeshStandardMaterial({ color: 0x8b6a43, roughness: 0.8, metalness: 0.08 });
        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor).multiplyScalar(0.15),
            emissiveIntensity: 0.6,
            roughness: 0.4,
            metalness: 0.2
        });

        const cabinTex = TextureGenerator.createBuildingFacade({
            color: '#e4f1ff',
            windowColor: '#2f6ba8',
            floors: 2,
            cols: 3,
            width: 256,
            height: 256
        });
        cabinTex.wrapS = THREE.RepeatWrapping;
        cabinTex.wrapT = THREE.RepeatWrapping;
        cabinTex.repeat.set(1.2, 0.8);

        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0xcde5ff,
            roughness: 0.55,
            metalness: 0.15,
            map: cabinTex
        });

        // Stilts
        const stiltGeo = new THREE.CylinderGeometry(0.14, 0.14, deckHeight, 10);
        const footGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 10);
        const stiltOffsets = [
            new THREE.Vector3(platformWidth * 0.46, deckHeight / 2, platformDepth * 0.46),
            new THREE.Vector3(-platformWidth * 0.46, deckHeight / 2, platformDepth * 0.46),
            new THREE.Vector3(platformWidth * 0.46, deckHeight / 2, -platformDepth * 0.46),
            new THREE.Vector3(-platformWidth * 0.46, deckHeight / 2, -platformDepth * 0.46)
        ];
        stiltOffsets.forEach((pos) => {
            const stilt = new THREE.Mesh(stiltGeo, supportMat);
            stilt.position.copy(pos);
            stilt.castShadow = true;
            stilt.receiveShadow = true;
            group.add(stilt);

            const foot = new THREE.Mesh(footGeo, supportMat);
            foot.position.set(pos.x, 0.09, pos.z);
            foot.castShadow = true;
            foot.receiveShadow = true;
            group.add(foot);
        });

        // Cross braces
        const braceGeo = new THREE.BoxGeometry(platformWidth * 0.9, 0.1, 0.12);
        const brace1 = new THREE.Mesh(braceGeo, supportMat);
        brace1.rotation.z = Math.atan(deckHeight / (platformWidth * 0.9));
        brace1.position.set(0, deckHeight * 0.5, platformDepth * 0.46);
        brace1.castShadow = true;
        brace1.receiveShadow = true;
        group.add(brace1);

        const brace2 = brace1.clone();
        brace2.rotation.z *= -1;
        brace2.position.z = -platformDepth * 0.46;
        group.add(brace2);

        // Deck platform
        const deckGeo = new THREE.BoxGeometry(platformWidth, deckThickness, platformDepth);
        const deck = new THREE.Mesh(deckGeo, woodMat);
        deck.position.y = deckHeight + deckThickness / 2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        // Railings
        const railHeight = 0.85;
        const railThickness = 0.08;
        const railGeoLong = new THREE.BoxGeometry(platformWidth * 0.95, railThickness, railThickness);
        const railGeoShort = new THREE.BoxGeometry(platformDepth * 0.9, railThickness, railThickness);

        const railY = deck.position.y + railHeight;
        const rails = [
            { geo: railGeoLong, pos: new THREE.Vector3(0, railY, platformDepth / 2 - railThickness / 2), rotY: 0 },
            { geo: railGeoLong, pos: new THREE.Vector3(0, railY, -platformDepth / 2 + railThickness / 2), rotY: 0 },
            { geo: railGeoShort, pos: new THREE.Vector3(platformWidth / 2 - railThickness / 2, railY, 0), rotY: Math.PI / 2 },
            { geo: railGeoShort, pos: new THREE.Vector3(-platformWidth / 2 + railThickness / 2, railY, 0), rotY: Math.PI / 2 }
        ];
        rails.forEach(({ geo, pos, rotY }) => {
            const rail = new THREE.Mesh(geo, supportMat);
            rail.position.copy(pos);
            rail.rotation.y = rotY;
            rail.castShadow = true;
            rail.receiveShadow = true;
            group.add(rail);
        });

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(platformWidth * 0.8, cabinHeight, platformDepth * 0.7);
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, deck.position.y + cabinHeight / 2 + deckThickness / 2, 0);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);

        // Roof
        const roofGeo = new THREE.BoxGeometry(cabinGeo.parameters.width * 1.05, 0.2, cabinGeo.parameters.depth * 1.05);
        const roof = new THREE.Mesh(roofGeo, accentMat);
        roof.position.set(cabin.position.x, cabin.position.y + cabinHeight / 2 + 0.1, cabin.position.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // Shade canopy slats
        const slatGeo = new THREE.BoxGeometry(roofGeo.parameters.width * 0.85, 0.05, 0.14);
        for (let i = -2; i <= 2; i++) {
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(roof.position.x, roof.position.y + 0.18, roof.position.z + i * 0.28);
            slat.castShadow = true;
            slat.receiveShadow = true;
            group.add(slat);
        }

        // Access stairs
        const stairs = new THREE.Group();
        const stepCount = 6;
        const stepRise = deckHeight / stepCount;
        const stepRun = 0.35;
        const stepGeo = new THREE.BoxGeometry(1.2, 0.08, stepRun);
        for (let i = 0; i < stepCount; i++) {
            const step = new THREE.Mesh(stepGeo, woodMat);
            step.position.set(platformWidth / 2 + 0.25, stepRise * (i + 1), platformDepth * 0.25 + i * (stepRun - 0.05));
            step.castShadow = true;
            step.receiveShadow = true;
            stairs.add(step);
        }
        group.add(stairs);

        // Stair railing
        const stairRailGeo = new THREE.BoxGeometry(0.08, deckHeight, 0.08);
        const stairRail = new THREE.Mesh(stairRailGeo, supportMat);
        stairRail.position.set(platformWidth / 2 + 0.8, deckHeight / 2 + 0.1, platformDepth * 0.25 + stepCount * (stepRun - 0.05));
        stairRail.castShadow = true;
        stairRail.receiveShadow = true;
        stairRail.rotation.z = -Math.atan(deckHeight / (stepCount * (stepRun - 0.05)));
        group.add(stairRail);

        // Lifebuoy
        const buoyGeo = new THREE.TorusGeometry(0.28, 0.07, 8, 16);
        const buoyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });
        const buoy = new THREE.Mesh(buoyGeo, buoyMat);
        buoy.position.set(-platformWidth / 2 + 0.2, deck.position.y + 0.35, platformDepth / 2 - 0.1);
        buoy.rotation.y = Math.PI / 2;
        buoy.castShadow = true;
        buoy.receiveShadow = true;
        group.add(buoy);

        // Beacon
        const beaconBaseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 10);
        const beaconBase = new THREE.Mesh(beaconBaseGeo, supportMat);
        beaconBase.position.set(roof.position.x + cabinGeo.parameters.width * 0.35, roof.position.y + 0.16, roof.position.z);
        beaconBase.castShadow = true;
        beaconBase.receiveShadow = true;
        group.add(beaconBase);

        this._beaconMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff0a3,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.25,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const beaconGeo = new THREE.SphereGeometry(0.15, 12, 12);
        const beacon = new THREE.Mesh(beaconGeo, this._beaconMaterial);
        beacon.position.copy(beaconBase.position).add(new THREE.Vector3(0, 0.18, 0));
        beacon.castShadow = true;
        beacon.receiveShadow = false;
        group.add(beacon);

        this._lightLocalPos = beacon.position.clone();

        // Flag
        const flagPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const flagPole = new THREE.Mesh(flagPoleGeo, supportMat);
        flagPole.position.set(roof.position.x - cabinGeo.parameters.width * 0.35, roof.position.y + 0.6, roof.position.z);
        flagPole.castShadow = true;
        flagPole.receiveShadow = true;
        group.add(flagPole);

        const flagGeo = new THREE.BoxGeometry(0.7, 0.34, 0.02);
        const flagMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.15 });
        this._flag = new THREE.Mesh(flagGeo, flagMat);
        this._flag.position.set(flagPole.position.x, flagPole.position.y + 0.4, flagPole.position.z + 0.36);
        this._flag.castShadow = true;
        this._flag.receiveShadow = true;
        group.add(this._flag);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 2.2;
            const range = this.params.lightRange || 18;
            this._virtualLight = lightSystem.register(worldPos, this.params.lightColor || 0xffe391, intensity, range);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const wave = 0.25 * Math.sin(this._time * 1.5);
        const flicker = 0.1 * Math.sin(this._time * 6.0 + Math.cos(this._time * 2.2));
        const emissiveIntensity = THREE.MathUtils.clamp(0.9 + wave * 0.3 + flicker, 0.6, 1.4);

        if (this._beaconMaterial) {
            this._beaconMaterial.emissiveIntensity = emissiveIntensity;
        }
        if (this._virtualLight) {
            this._virtualLight.intensity = (this.params.lightIntensity || 2.2) * (0.8 + wave * 0.2 + flicker * 0.5);
        }
        if (this._flag) {
            this._flag.rotation.z = 0.05 * Math.sin(this._time * 2.5) + 0.03 * Math.cos(this._time * 1.7);
        }
    }
}

EntityRegistry.register('lifeguardTower', LifeguardTowerEntity);
