import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class SpectralBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'spectralBeacon';
        this._time = 0;
        this._ringGroup = null;
        this._coreMaterial = null;
        this._glowMaterials = [];
        this._orbiters = [];
        this._baseRotation = this.rotation.clone();
        this._spinSpeed = params.spinSpeed ?? (0.5 + Math.random() * 0.5);
        this._floatPhase = params.floatPhase ?? Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Spectral Beacon'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height ?? (2.4 + Math.random() * 0.4);
        const ringCount = params.ringCount ?? 3;
        this.params.height = height;
        this.params.ringCount = ringCount;
        this.params.spinSpeed = this._spinSpeed;
        this.params.floatPhase = this._floatPhase;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x7b7f87,
            map: concreteTex,
            roughness: 0.9,
            metalness: 0.1
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.25, 20), baseMat);
        base.position.y = 0.125;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plinthMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.6,
            metalness: 0.4
        });
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.1), plinthMat);
        plinth.position.y = 0.35;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.45,
            metalness: 0.55
        });
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, height, 16), columnMat);
        column.position.y = height / 2 + 0.45;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const coreGroup = new THREE.Group();
        coreGroup.position.y = height + 0.55;
        group.add(coreGroup);

        const energyTexture = this.createEnergyTexture();
        const coreMaterial = new THREE.MeshStandardMaterial({
            map: energyTexture,
            color: 0x9fe8ff,
            emissive: new THREE.Color(0x64d7ff),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95
        });
        this._coreMaterial = coreMaterial;
        this._glowMaterials.push(coreMaterial);

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), coreMaterial);
        core.castShadow = false;
        coreGroup.add(core);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = height + 0.55;
        this._ringGroup = ringGroup;
        group.add(ringGroup);

        const ringMaterial = new THREE.MeshStandardMaterial({
            map: energyTexture,
            color: 0x7ef9ff,
            emissive: new THREE.Color(0x7ef9ff),
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.7,
            roughness: 0.2,
            metalness: 0.05
        });
        this._glowMaterials.push(ringMaterial);

        for (let i = 0; i < ringCount; i += 1) {
            const radius = 0.5 + i * 0.14;
            const tube = 0.03 + i * 0.01;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 48), ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = (Math.PI / ringCount) * i;
            ringGroup.add(ring);
        }

        const shardMaterial = new THREE.MeshStandardMaterial({
            color: 0xa7f3ff,
            emissive: new THREE.Color(0x6ee7ff),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        });
        this._glowMaterials.push(shardMaterial);

        const shardGeo = new THREE.PlaneGeometry(0.12, 0.32);
        for (let i = 0; i < 6; i += 1) {
            const shard = new THREE.Mesh(shardGeo, shardMaterial);
            shard.rotation.y = (Math.PI * 2 / 6) * i;
            shard.position.set(Math.cos(i) * 0.35, 0.08, Math.sin(i) * 0.35);
            coreGroup.add(shard);
        }

        const orbiterMaterial = new THREE.MeshStandardMaterial({
            color: 0x6ad8ff,
            emissive: new THREE.Color(0x6ad8ff),
            emissiveIntensity: 1.1
        });
        this._glowMaterials.push(orbiterMaterial);

        for (let i = 0; i < 4; i += 1) {
            const orbiter = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), orbiterMaterial);
            coreGroup.add(orbiter);
            this._orbiters.push({
                mesh: orbiter,
                radius: 0.32 + i * 0.06,
                speed: 0.8 + i * 0.2,
                phase: Math.random() * Math.PI * 2,
                height: -0.04 + i * 0.035
            });
        }

        return group;
    }

    createEnergyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        gradient.addColorStop(0, 'rgba(120, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(64, 200, 255, 0.55)');
        gradient.addColorStop(1, 'rgba(32, 120, 200, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(180, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i += 1) {
            ctx.beginPath();
            ctx.arc(128, 128, 30 + i * 16, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(200, 255, 255, 0.18)';
        for (let i = 0; i < 30; i += 1) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                6 + Math.random() * 10,
                1 + Math.random() * 2
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const pulse = 0.7 + 0.25 * Math.sin(this._time * 3.2) + 0.1 * Math.sin(this._time * 7.1);

        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y,
                this._baseRotation.z
            );
        }

        if (this._ringGroup) {
            this._ringGroup.rotation.y += dt * this._spinSpeed;
            this._ringGroup.rotation.x = Math.sin(this._time * 0.6 + this._floatPhase) * 0.15;
        }

        if (this._glowMaterials.length) {
            this._glowMaterials.forEach((material, index) => {
                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = THREE.MathUtils.clamp(pulse + index * 0.05, 0.6, 1.6);
                }
                if (material.opacity !== undefined) {
                    material.opacity = THREE.MathUtils.clamp(0.55 + pulse * 0.2, 0.5, 0.9);
                }
            });
        }

        if (this._orbiters.length) {
            this._orbiters.forEach((orbiter) => {
                const angle = this._time * orbiter.speed + orbiter.phase;
                orbiter.mesh.position.set(
                    Math.cos(angle) * orbiter.radius,
                    orbiter.height + Math.sin(angle * 1.4) * 0.03,
                    Math.sin(angle) * orbiter.radius
                );
            });
        }
    }
}

EntityRegistry.register('spectralBeacon', SpectralBeaconEntity);
