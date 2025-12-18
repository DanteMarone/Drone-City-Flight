import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const BUOY_COLORS = [0xff7043, 0x2bb3c0, 0xffd166, 0x5de0a5];

export class RiverBuoyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'riverBuoy';
        this._time = Math.random() * Math.PI * 2;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._basePosition = new THREE.Vector3();
        this._baseRotation = new THREE.Euler();
    }

    static get displayName() { return 'River Buoy'; }

    createMesh(params) {
        const group = new THREE.Group();

        const hullHeight = params.hullHeight || 1.1;
        const hullRadiusTop = params.hullRadiusTop || 0.58;
        const hullRadiusBottom = params.hullRadiusBottom || 0.72;
        const mastHeight = params.mastHeight || 1.2;
        const accent = params.accentColor || BUOY_COLORS[Math.floor(Math.random() * BUOY_COLORS.length)];

        const hullTexture = TextureGenerator.createConcrete();
        hullTexture.wrapS = THREE.RepeatWrapping;
        hullTexture.wrapT = THREE.RepeatWrapping;
        hullTexture.repeat.set(2, 1.5);

        const hullMaterial = new THREE.MeshStandardMaterial({
            color: accent,
            roughness: 0.45,
            metalness: 0.25,
            map: hullTexture
        });

        const hullGeo = new THREE.CylinderGeometry(hullRadiusTop, hullRadiusBottom, hullHeight, 18, 1, false);
        const hull = new THREE.Mesh(hullGeo, hullMaterial);
        hull.position.y = hullHeight / 2;
        hull.castShadow = true;
        hull.receiveShadow = true;
        group.add(hull);

        const bumpRingGeo = new THREE.TorusGeometry(hullRadiusBottom * 0.95, 0.05, 8, 16);
        const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.9, metalness: 0.05 });
        const bumper = new THREE.Mesh(bumpRingGeo, rubberMat);
        bumper.rotation.x = Math.PI / 2;
        bumper.position.y = hullHeight * 0.18;
        bumper.castShadow = true;
        group.add(bumper);

        const collarGeo = new THREE.CylinderGeometry(hullRadiusTop * 0.85, hullRadiusTop * 0.92, 0.25, 12);
        const collarMat = new THREE.MeshStandardMaterial({ color: 0xdde5ec, roughness: 0.3, metalness: 0.35 });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.y = hullHeight - 0.1;
        collar.castShadow = true;
        group.add(collar);

        const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, mastHeight, 10);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x8895a7, roughness: 0.35, metalness: 0.55 });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.y = hullHeight + mastHeight / 2;
        mast.castShadow = true;
        group.add(mast);

        const braceMat = new THREE.MeshStandardMaterial({ color: 0xe5edf5, roughness: 0.3, metalness: 0.4 });
        const braceGeo = new THREE.BoxGeometry(hullRadiusTop * 1.4, 0.06, 0.12);
        const brace1 = new THREE.Mesh(braceGeo, braceMat);
        brace1.position.y = hullHeight + mastHeight * 0.25;
        brace1.castShadow = true;
        group.add(brace1);

        const brace2 = brace1.clone();
        brace2.rotation.y = Math.PI / 2;
        group.add(brace2);

        const beaconGeo = new THREE.CylinderGeometry(0.12, 0.2, 0.32, 12);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.6,
            roughness: 0.15,
            metalness: 0.4
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = hullHeight + mastHeight + 0.2;
        beacon.castShadow = true;
        group.add(beacon);

        const lensGeo = new THREE.SphereGeometry(0.16, 12, 10);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xd6f4ff,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.2
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.y = beacon.position.y + 0.28;
        lens.castShadow = false;
        group.add(lens);

        const cageGeo = new THREE.TorusGeometry(0.18, 0.02, 6, 12);
        const cageMat = new THREE.MeshStandardMaterial({ color: 0x9fb3c8, roughness: 0.25, metalness: 0.6 });
        const cage = new THREE.Mesh(cageGeo, cageMat);
        cage.rotation.x = Math.PI / 2;
        cage.position.y = lens.position.y + 0.06;
        cage.castShadow = false;
        group.add(cage);

        this._lightAnchor.set(0, lens.position.y, 0);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._basePosition.copy(this.mesh.position);
            this._baseRotation.copy(this.mesh.rotation);
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 1.3;
            this._lightHandle = lightSystem.register(worldPos, this.params.lightColor || 0xfff1c1, intensity, 18);
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const bobSpeed = this.params.bobSpeed || 0.6;
        const bobAmount = this.params.bobAmount || 0.18;
        const swayAmount = THREE.MathUtils.degToRad(2.5);
        const spinSpeed = this.params.spinSpeed || 0.3;

        const bob = Math.sin(this._time * bobSpeed) * bobAmount;
        const swayX = Math.sin(this._time * (bobSpeed * 1.3)) * swayAmount;
        const swayZ = Math.cos(this._time * (bobSpeed * 1.1)) * swayAmount;

        this.mesh.position.y = this._basePosition.y + bob;
        this.mesh.rotation.set(
            this._baseRotation.x + swayX,
            this._baseRotation.y + this._time * spinSpeed,
            this._baseRotation.z + swayZ
        );

        if (this._lightHandle) {
            const pulse = 0.15 + Math.sin(this._time * 2.2) * 0.25;
            const baseIntensity = this.params.lightIntensity || 1.3;
            this._lightHandle.intensity = Math.max(0, baseIntensity + pulse);

            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle.pos.copy(worldPos);
        }
    }
}

EntityRegistry.register('riverBuoy', RiverBuoyEntity);
