import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class NavigationRingEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'navigationRing';
        this._time = 0;
        this._ringPivot = null;
        this._glowMaterial = null;
        this._lightHandle = null;
        this._lightLocalPos = null;
        this._baseY = 0;
    }

    static get displayName() { return 'Navigation Ring'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 1.4 + Math.random() * 0.3;
        const ringRadius = params.ringRadius || baseRadius + 0.35;
        const ringHeight = params.ringHeight || 1.2 + Math.random() * 0.4;
        this._baseY = ringHeight;

        // Base platform with asphalt texture
        const asphaltTex = TextureGenerator.createAsphalt();
        asphaltTex.repeat.set(2, 2);
        asphaltTex.wrapS = THREE.RepeatWrapping;
        asphaltTex.wrapT = THREE.RepeatWrapping;

        const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 0.28, 24);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2e3440,
            roughness: 0.85,
            metalness: 0.1,
            map: asphaltTex
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.castShadow = true;
        base.receiveShadow = true;
        base.position.y = 0.14;
        group.add(base);

        // Inner core with panel texture
        const panelTex = TextureGenerator.createBuildingFacade({
            color: '#1b2330',
            windowColor: '#16e0ff',
            floors: 6,
            cols: 2,
            width: 256,
            height: 256
        });
        panelTex.repeat.set(2, 1.5);

        const coreGeo = new THREE.CylinderGeometry(baseRadius * 0.4, baseRadius * 0.6, ringHeight, 20, 1, true);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x111820,
            roughness: 0.55,
            metalness: 0.35,
            map: panelTex,
            emissive: new THREE.Color(0x0a2a33),
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.92,
            side: THREE.DoubleSide
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = ringHeight / 2;
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);

        // Stabilizing fins
        const finMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.65 });
        const finGeo = new THREE.BoxGeometry(baseRadius * 0.2, ringHeight * 0.4, 0.12);
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(finGeo, finMat);
            const angle = (i / 3) * Math.PI * 2;
            fin.position.set(Math.cos(angle) * baseRadius * 0.7, ringHeight * 0.5, Math.sin(angle) * baseRadius * 0.7);
            fin.rotation.y = angle;
            fin.castShadow = true;
            fin.receiveShadow = true;
            group.add(fin);
        }

        // Ring pivot (spins)
        const ringPivot = new THREE.Group();
        ringPivot.position.y = ringHeight;
        this._ringPivot = ringPivot;

        // Glowing torus ring
        const ringGeo = new THREE.TorusGeometry(ringRadius, 0.12, 12, 72);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x4cf1ff,
            emissive: new THREE.Color(0x4cf1ff),
            emissiveIntensity: 0.9,
            metalness: 0.25,
            roughness: 0.3
        });
        const ringMesh = new THREE.Mesh(ringGeo, this._glowMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;
        ringPivot.add(ringMesh);

        // Directional chevrons for pilots
        const chevronMat = new THREE.MeshStandardMaterial({
            color: 0xfff3b0,
            emissive: new THREE.Color(0xffc847),
            emissiveIntensity: 0.35,
            metalness: 0.2,
            roughness: 0.45
        });
        const chevronGeo = new THREE.BoxGeometry(0.26, 0.08, ringRadius * 0.5);
        for (let i = 0; i < 4; i++) {
            const chevron = new THREE.Mesh(chevronGeo, chevronMat);
            const angle = (i / 4) * Math.PI * 2;
            chevron.position.set(Math.cos(angle) * ringRadius * 0.5, 0, Math.sin(angle) * ringRadius * 0.5);
            chevron.rotation.y = angle + Math.PI / 2;
            ringPivot.add(chevron);
        }

        // Suspended emitter pod
        const podGeo = new THREE.CylinderGeometry(0.16, 0.25, 0.4, 12);
        const podMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.35, metalness: 0.7 });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.y = -0.28;
        pod.castShadow = true;
        ringPivot.add(pod);

        // Light registration position (center of the ring)
        this._lightLocalPos = new THREE.Vector3(0, ringHeight, 0);

        group.add(ringPivot);
        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register({
                position: worldPos,
                color: 0x4cf1ff,
                intensity: this.params.lightIntensity || 1.6,
                range: 18,
                parentMesh: this.mesh
            });
        }
    }

    update(dt) {
        if (!this.mesh || !this._ringPivot) return;

        this._time += dt;
        const bob = Math.sin(this._time * 2.1) * 0.08;
        this._ringPivot.position.y = this._baseY + bob;
        this._ringPivot.rotation.y += dt * 0.9;

        if (this._glowMaterial) {
            const pulse = 0.25 + 0.25 * Math.sin(this._time * 3.3);
            this._glowMaterial.emissiveIntensity = 0.8 + pulse;
        }

        if (this._lightHandle) {
            const base = this.params.lightIntensity || 1.6;
            const modulation = 0.4 + 0.35 * Math.sin(this._time * 3.3);
            this._lightHandle.intensity = Math.max(0, base * modulation);
        }
    }
}

EntityRegistry.register('navigationRing', NavigationRingEntity);
