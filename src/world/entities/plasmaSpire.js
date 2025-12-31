import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class PlasmaSpireEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'plasmaSpire';
        this._time = 0;
        this._ringGroup = null;
        this._ringMaterials = [];
        this._coreMaterials = [];
        this._beamMaterial = null;
        if (this.params.seed === undefined) {
            this.params.seed = Math.random() * 1000;
        }
    }

    static get displayName() { return 'Plasma Spire'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 2.6;
        this.params.height = height;

        const baseTexture = TextureGenerator.createConcrete();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x7b7b82,
            roughness: 0.9,
            metalness: 0.05,
            map: baseTexture
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 0.25, 18), baseMat);
        base.position.y = 0.125;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.35,
            metalness: 0.65
        });
        const column = new THREE.Mesh(new THREE.BoxGeometry(0.5, height * 0.65, 0.5), columnMat);
        column.position.y = height * 0.325 + 0.25;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.4,
            metalness: 0.6
        });
        const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 16), trimMat);
        trim.position.y = height * 0.65 + 0.25;
        trim.castShadow = true;
        group.add(trim);

        const coreGroup = new THREE.Group();
        coreGroup.position.y = height * 0.65 + 0.38;
        group.add(coreGroup);
        this._ringGroup = coreGroup;

        const colorSeed = (params.seed || 0) * 0.0007;
        const baseColor = new THREE.Color().setHSL(0.56 + colorSeed, 0.75, 0.55);

        const coreTexture = this.createPulseTexture();
        const coreMat = new THREE.MeshStandardMaterial({
            map: coreTexture,
            color: baseColor,
            emissive: baseColor.clone(),
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        });
        this._coreMaterials.push(coreMat);

        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), coreMat);
        core.castShadow = false;
        coreGroup.add(core);

        const ringTexture = this.createRingTexture();
        const ringMat = new THREE.MeshStandardMaterial({
            map: ringTexture,
            color: baseColor,
            emissive: baseColor.clone(),
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this._ringMaterials.push(ringMat);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 12, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        coreGroup.add(ring);

        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 10, 28), ringMat);
        ring2.rotation.set(Math.PI / 2, Math.PI / 3, 0);
        ring2.position.y = 0.12;
        coreGroup.add(ring2);

        const beamTexture = this.createBeamTexture();
        const beamMat = new THREE.MeshStandardMaterial({
            map: beamTexture,
            color: baseColor,
            emissive: baseColor.clone(),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this._beamMaterial = beamMat;

        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.65, 24, 1, true), beamMat);
        beam.position.y = 0.45;
        coreGroup.add(beam);

        const capMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.3,
            metalness: 0.7
        });
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.18, 16), capMat);
        cap.position.y = height * 0.65 + 0.56;
        cap.castShadow = true;
        group.add(cap);

        return group;
    }

    createPulseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 120);
        gradient.addColorStop(0, 'rgba(120, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(80, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(30, 90, 200, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(200, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i += 1) {
            ctx.beginPath();
            ctx.arc(128, 128, 16 + i * 14, 0, Math.PI * 2);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    createRingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(120, 240, 255, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 64, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i += 1) {
            ctx.beginPath();
            ctx.arc(64, 64, 24 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    createBeamTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(20, 40, 80, 0)');
        gradient.addColorStop(0.5, 'rgba(120, 240, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(20, 40, 80, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 18; i += 1) {
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 6, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += dt * 0.8;
            this._ringGroup.rotation.x = Math.sin(this._time * 0.7) * 0.2;
            this._ringGroup.position.y = (this.params.height || 2.6) * 0.65 + 0.38 + Math.sin(this._time * 1.4) * 0.04;
        }

        const pulse = 0.2 + 0.2 * Math.sin(this._time * 3.2) + 0.1 * Math.sin(this._time * 7.4);
        this._coreMaterials.forEach((material) => {
            material.emissiveIntensity = THREE.MathUtils.clamp(1 + pulse, 0.7, 1.6);
        });
        this._ringMaterials.forEach((material) => {
            material.opacity = THREE.MathUtils.clamp(0.6 + pulse * 0.6, 0.35, 0.9);
        });

        if (this._beamMaterial) {
            this._beamMaterial.opacity = THREE.MathUtils.clamp(0.4 + pulse * 0.6, 0.25, 0.9);
            if (this._beamMaterial.map) {
                this._beamMaterial.map.offset.x = (this._time * 0.6) % 1;
            }
        }
    }
}

EntityRegistry.register('plasmaSpire', PlasmaSpireEntity);
