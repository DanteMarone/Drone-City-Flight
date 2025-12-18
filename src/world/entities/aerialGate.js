import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class AerialGateEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'aerialGate';
        this._ringPivot = null;
        this._ringBaseHeight = 0;
        this._glowMaterial = null;
        this._lightHandle = null;
        this._lightLocalPos = new THREE.Vector3();
        this._time = 0;
    }

    static get displayName() { return 'Aerial Gate'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseTex = TextureGenerator.createConcrete();
        baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;
        baseTex.repeat.set(2, 2);

        const baseMat = new THREE.MeshStandardMaterial({
            map: baseTex,
            roughness: 0.85,
            metalness: 0.08
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.5, 24), baseMat);
        base.castShadow = true;
        base.receiveShadow = true;
        base.position.y = 0.25;
        group.add(base);

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 1.6, 24), baseMat);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        pedestal.position.y = base.position.y + 0.8;
        group.add(pedestal);

        const strutMat = new THREE.MeshStandardMaterial({
            color: 0x1b2432,
            roughness: 0.3,
            metalness: 0.65
        });
        const strutGeo = new THREE.BoxGeometry(0.4, 3.6, 0.9);

        const strutLeft = new THREE.Mesh(strutGeo, strutMat);
        strutLeft.position.set(-1.35, pedestal.position.y + 1.5, 0);
        strutLeft.rotation.z = THREE.MathUtils.degToRad(8);
        strutLeft.castShadow = true;
        strutLeft.receiveShadow = true;
        group.add(strutLeft);

        const strutRight = strutLeft.clone();
        strutRight.position.x = 1.35;
        strutRight.rotation.z = -strutLeft.rotation.z;
        group.add(strutRight);

        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.32, 0.6), strutMat);
        brace.castShadow = true;
        brace.receiveShadow = true;
        brace.position.set(0, pedestal.position.y + 2.6, 0);
        group.add(brace);

        const panelTex = TextureGenerator.createBuildingFacade({
            color: '#1b2a3c',
            windowColor: '#7bf2ff',
            floors: 2,
            cols: 14,
            width: 512,
            height: 128
        });
        panelTex.wrapS = panelTex.wrapT = THREE.RepeatWrapping;
        panelTex.repeat.set(2.5, 0.7);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: panelTex,
            roughness: 0.35,
            metalness: 0.55
        });

        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x7ff1ff,
            emissive: new THREE.Color(0x4ad5ff),
            emissiveIntensity: 1.3,
            roughness: 0.15,
            metalness: 0.08,
            transparent: true,
            opacity: 0.9
        });

        const ringPivot = new THREE.Group();
        ringPivot.position.set(0, brace.position.y + 1.45, 0);
        this._ringPivot = ringPivot;
        this._ringBaseHeight = ringPivot.position.y;

        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3, 0.28, 18, 64), ringMat);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.castShadow = true;
        outerRing.receiveShadow = true;
        ringPivot.add(outerRing);

        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.15, 16, 48), this._glowMaterial);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.castShadow = true;
        innerRing.receiveShadow = true;
        ringPivot.add(innerRing);

        const finGeo = new THREE.BoxGeometry(0.26, 0.7, 0.65);
        const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.35 });
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeo, finMat);
            const angle = (i / 4) * Math.PI * 2;
            fin.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
            fin.rotation.y = angle;
            fin.rotation.x = Math.PI / 2;
            fin.castShadow = true;
            ringPivot.add(fin);
        }

        const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 12), new THREE.MeshStandardMaterial({
            color: 0xffc857,
            roughness: 0.4,
            metalness: 0.25
        }));
        arrow.position.set(0, -1.15, 0.28);
        arrow.rotation.x = Math.PI;
        arrow.castShadow = true;
        ringPivot.add(arrow);

        group.add(ringPivot);

        this._lightLocalPos.set(0, ringPivot.position.y, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this.params.lightColor || 0x4ad5ff,
                this.params.lightIntensity ?? 2.8,
                this.params.lightRange ?? 28
            );
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this._ringPivot || this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        if (this._ringPivot) {
            this._ringPivot.rotation.y += dt * 0.75;
            this._ringPivot.rotation.z = Math.sin(this._time * 1.3) * 0.08;
            this._ringPivot.position.y = this._ringBaseHeight + Math.sin(this._time * 2.1) * 0.1;
        }

        if (this._glowMaterial) {
            const pulse = 0.7 + 0.3 * Math.sin(this._time * 3.2);
            this._glowMaterial.emissiveIntensity = 1.0 + pulse;
            this._glowMaterial.opacity = 0.82 + 0.14 * pulse;
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity ?? 2.8;
            const wave = 0.65 + 0.35 * Math.sin(this._time * 3.2);
            this._lightHandle.intensity = baseIntensity * wave;
        }
    }
}

EntityRegistry.register('aerialGate', AerialGateEntity);
