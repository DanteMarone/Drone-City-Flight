import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class EmergencySirenTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'emergencySirenTower';
        this._time = 0;
        this._headGroup = null;
        this._beaconMaterials = [];
        this._virtualLights = [];
        this._lightAnchors = [];
    }

    static get displayName() { return 'Emergency Siren Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            map: baseTex,
            roughness: 0.9,
            metalness: 0.15
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x374151,
            roughness: 0.35,
            metalness: 0.75
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xb91c1c,
            roughness: 0.45,
            metalness: 0.4
        });

        // Sturdy pedestal
        const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.28, 16), baseMaterial);
        footing.position.y = 0.14;
        footing.receiveShadow = true;
        footing.castShadow = true;
        group.add(footing);

        const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.2, 16), baseMaterial);
        riser.position.y = footing.position.y + 0.24;
        riser.castShadow = true;
        riser.receiveShadow = true;
        group.add(riser);

        // Main mast
        const mastHeight = params.mastHeight || 4.5;
        this.params.mastHeight = mastHeight;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, mastHeight, 18), metalMaterial);
        mast.position.y = riser.position.y + mastHeight / 2 + 0.1;
        mast.castShadow = true;
        mast.receiveShadow = true;
        group.add(mast);

        // Support collar
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24), metalMaterial);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = mast.position.y + mastHeight * 0.35;
        group.add(collar);

        // Control box with emergency markings
        const panelTex = TextureGenerator.createBuildingFacade({
            color: '#0f172a',
            windowColor: '#e11d48',
            floors: 4,
            cols: 2,
            width: 128,
            height: 128
        });
        const controlMaterial = new THREE.MeshStandardMaterial({
            map: panelTex,
            color: 0xffffff,
            roughness: 0.55,
            metalness: 0.25,
            emissive: new THREE.Color(0x1d4ed8),
            emissiveIntensity: 0.4
        });
        const controlBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.4), controlMaterial);
        controlBox.position.set(0, mast.position.y + mastHeight * 0.2, 0.22);
        controlBox.castShadow = true;
        controlBox.receiveShadow = true;
        group.add(controlBox);

        const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), accentMaterial);
        badge.rotation.x = Math.PI / 2;
        badge.position.set(0, controlBox.position.y + 0.1, controlBox.position.z + 0.23);
        badge.castShadow = true;
        group.add(badge);

        // Speaker ring and beacon head
        this._headGroup = new THREE.Group();
        this._headGroup.position.y = mast.position.y + mastHeight / 2 + 0.2;
        group.add(this._headGroup);

        const headBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.25, 16), metalMaterial);
        headBase.castShadow = true;
        headBase.receiveShadow = true;
        this._headGroup.add(headBase);

        // Four directional loudspeakers
        const speakerGeo = new THREE.ConeGeometry(0.22, 0.4, 12, 1, true);
        for (let i = 0; i < 4; i++) {
            const speaker = new THREE.Mesh(speakerGeo, new THREE.MeshStandardMaterial({
                color: 0x9ca3af,
                roughness: 0.5,
                metalness: 0.35,
                side: THREE.DoubleSide
            }));
            speaker.position.y = 0.05;
            speaker.rotation.z = Math.PI;
            speaker.rotation.y = (Math.PI / 2) * i;
            speaker.position.x = Math.cos((Math.PI / 2) * i) * 0.35;
            speaker.position.z = Math.sin((Math.PI / 2) * i) * 0.35;
            this._headGroup.add(speaker);
        }

        const beaconCap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.2, 14), accentMaterial);
        beaconCap.position.y = 0.25;
        beaconCap.castShadow = true;
        this._headGroup.add(beaconCap);

        const beaconRing = new THREE.Group();
        beaconRing.position.y = beaconCap.position.y + 0.12;
        this._headGroup.add(beaconRing);

        const beaconGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.18, 12);
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: new THREE.Color(0xb91c1c),
            emissiveIntensity: 0.9,
            metalness: 0.15,
            roughness: 0.3,
            transparent: true,
            opacity: 0.95
        });
        const blueMat = new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            emissive: new THREE.Color(0x1d4ed8),
            emissiveIntensity: 0.9,
            metalness: 0.15,
            roughness: 0.3,
            transparent: true,
            opacity: 0.95
        });

        const redBeacon = new THREE.Mesh(beaconGeo, redMat);
        redBeacon.position.set(-0.18, 0, 0);
        redBeacon.castShadow = true;
        beaconRing.add(redBeacon);

        const blueBeacon = new THREE.Mesh(beaconGeo, blueMat);
        blueBeacon.position.set(0.18, 0, 0);
        blueBeacon.castShadow = true;
        beaconRing.add(blueBeacon);

        this._beaconMaterials = [redMat, blueMat];

        const redAnchor = new THREE.Object3D();
        redAnchor.position.copy(redBeacon.position);
        beaconRing.add(redAnchor);

        const blueAnchor = new THREE.Object3D();
        blueAnchor.position.copy(blueBeacon.position);
        beaconRing.add(blueAnchor);

        this._lightAnchors = [redAnchor, blueAnchor];

        const topAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 12), metalMaterial);
        topAntenna.position.set(0, beaconRing.position.y + 0.35, 0);
        topAntenna.castShadow = true;
        this._headGroup.add(topAntenna);

        const spinner = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), accentMaterial);
        spinner.position.y = topAntenna.position.y + 0.25;
        spinner.castShadow = true;
        this._headGroup.add(spinner);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightAnchors.length) {
            this._virtualLights = this._lightAnchors.map((anchor, index) => {
                anchor.updateMatrixWorld(true);
                const worldPos = new THREE.Vector3();
                anchor.getWorldPosition(worldPos);
                const color = index === 0 ? 0xb91c1c : 0x1d4ed8;
                const source = lightSystem.register(worldPos, color, this.params.lightIntensity || 1.8, 16);
                if (source) {
                    source.parentMesh = anchor;
                }
                return source;
            });
        }
    }

    update(dt) {
        this._time += dt;

        const spinSpeed = this.params.spinSpeed || 0.8;
        if (this._headGroup) {
            this._headGroup.rotation.y += spinSpeed * dt;
        }

        const pulse = 0.5 + 0.5 * Math.sin(this._time * 4);
        const inversePulse = 1 - pulse;
        if (this._beaconMaterials.length === 2) {
            this._beaconMaterials[0].emissiveIntensity = THREE.MathUtils.clamp(0.5 + pulse, 0.5, 1.6);
            this._beaconMaterials[1].emissiveIntensity = THREE.MathUtils.clamp(0.5 + inversePulse, 0.5, 1.6);
        }

        if (this._virtualLights && this._virtualLights.length === 2) {
            const baseIntensity = this.params.lightIntensity || 1.8;
            const variance = 0.9;
            if (this._virtualLights[0]) {
                this._virtualLights[0].intensity = THREE.MathUtils.clamp(baseIntensity * (0.6 + pulse * variance), 0.5, baseIntensity * 2);
            }
            if (this._virtualLights[1]) {
                this._virtualLights[1].intensity = THREE.MathUtils.clamp(baseIntensity * (0.6 + inversePulse * variance), 0.5, baseIntensity * 2);
            }
        }
    }
}

EntityRegistry.register('emergencySirenTower', EmergencySirenTowerEntity);
