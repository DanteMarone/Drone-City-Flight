import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class DroneBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'droneBeacon';
        this._time = 0;
        this._headPivot = null;
        this._glowMaterial = null;
        this._lightHandle = null;
        this._lightAnchor = null;
        this._scratchVec = new THREE.Vector3();
        this._headBaseY = 0;
        this._lightColor = new THREE.Color(params.lightColor || 0x6be0ff);
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Drone Beacon'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseHeight = params.baseHeight || 0.32;
        const mastHeight = params.mastHeight || 2.6 + Math.random() * 0.4;
        const collarHeight = 0.18;
        this.params.baseHeight = baseHeight;
        this.params.mastHeight = mastHeight;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9b9fa6,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.05
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, baseHeight, 16), baseMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const anchorCap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 18), baseMaterial);
        anchorCap.position.y = base.position.y + baseHeight / 2 + 0.05;
        anchorCap.castShadow = true;
        anchorCap.receiveShadow = true;
        group.add(anchorCap);

        const mastMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.4,
            metalness: 0.8
        });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, mastHeight, 18), mastMaterial);
        mast.position.y = anchorCap.position.y + mastHeight / 2 + 0.05;
        mast.castShadow = true;
        mast.receiveShadow = true;
        group.add(mast);

        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, collarHeight, 16), mastMaterial);
        collar.position.y = mast.position.y + mastHeight / 2 + collarHeight / 2;
        collar.castShadow = true;
        collar.receiveShadow = true;
        group.add(collar);

        const stripeTex = TextureGenerator.createBuildingFacade({
            color: '#0d1a2b',
            windowColor: '#6be0ff',
            floors: 2,
            cols: 16,
            width: 256,
            height: 64
        });
        stripeTex.wrapS = THREE.RepeatWrapping;
        stripeTex.wrapT = THREE.RepeatWrapping;
        const stripeMaterial = new THREE.MeshStandardMaterial({
            map: stripeTex,
            color: 0xffffff,
            emissive: new THREE.Color(0x19324a),
            emissiveIntensity: 0.6,
            roughness: 0.5,
            metalness: 0.25
        });
        const stripeBand = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 32, 1, true), stripeMaterial);
        stripeBand.position.y = collar.position.y + collarHeight / 2 + 0.16;
        group.add(stripeBand);

        const headPivot = new THREE.Group();
        headPivot.position.y = stripeBand.position.y + 0.35;
        this._headPivot = headPivot;
        this._headBaseY = headPivot.position.y;

        const emitterMaterial = new THREE.MeshStandardMaterial({
            color: this._lightColor,
            emissive: this._lightColor,
            emissiveIntensity: 1.25,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        this._glowMaterial = emitterMaterial;

        const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.35, 24), emitterMaterial);
        emitter.castShadow = true;
        emitter.receiveShadow = false;
        emitter.position.y = 0.28;
        headPivot.add(emitter);

        const crown = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 10, 24), mastMaterial);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = emitter.position.y + 0.18;
        headPivot.add(crown);

        const finsGeo = new THREE.BoxGeometry(0.06, 0.26, 0.32);
        const finsMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.35, roughness: 0.35 });
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(finsGeo, finsMat);
            fin.position.y = emitter.position.y + 0.05;
            fin.position.x = 0.24;
            fin.castShadow = true;
            fin.receiveShadow = true;
            fin.rotation.y = Math.PI / 2;
            const finHolder = new THREE.Group();
            finHolder.rotation.y = (i / 3) * Math.PI * 2;
            finHolder.add(fin);
            headPivot.add(finHolder);
        }

        const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mastMaterial);
        beaconTop.position.y = crown.position.y + 0.18;
        headPivot.add(beaconTop);

        const lightAnchor = new THREE.Object3D();
        lightAnchor.position.y = emitter.position.y + 0.08;
        headPivot.add(lightAnchor);
        this._lightAnchor = lightAnchor;

        group.add(headPivot);
        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this._lightAnchor) {
            this._lightAnchor.updateMatrixWorld(true);
            this._scratchVec.setFromMatrixPosition(this._lightAnchor.matrixWorld);
            this._lightHandle = lightSystem.register(
                this._scratchVec,
                this._lightColor.getHex(),
                this.params.lightIntensity || 1.4,
                this.params.lightRange || 18
            );

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this._lightAnchor;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.7 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.3);
        this.mesh.rotation.set(this._baseRotation.x, this._baseRotation.y, this._baseRotation.z + sway);

        if (this._headPivot) {
            this._headPivot.rotation.y += dt * 0.8;
            this._headPivot.position.y = this._headBaseY + Math.sin(this._time * 1.6) * 0.02;
        }

        const pulse = 0.65 + 0.35 * Math.sin(this._time * 3.1);
        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 1 + pulse * 0.6;
            this._glowMaterial.opacity = 0.8 + pulse * 0.15;
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 1.4;
            this._lightHandle.intensity = baseIntensity * (0.8 + pulse * 0.7);
        }
    }
}

EntityRegistry.register('droneBeacon', DroneBeaconEntity);
