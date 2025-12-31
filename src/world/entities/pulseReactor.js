import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class PulseReactorEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'pulseReactor';
        this._time = Math.random() * Math.PI * 2;
        this._ringGroup = null;
        this._orbitGroup = null;
        this._glowMaterials = [];
        this._spinSpeed = params.spinSpeed ?? (0.6 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.4 + Math.random() * 0.6);
        this._liftHeight = 0;
    }

    static get displayName() { return 'Pulse Reactor'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? 1.05 + Math.random() * 0.2;
        const baseHeight = 0.22;
        this.params.baseRadius = baseRadius;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.repeat.set(1.5, 1.5);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x8b8f95,
            map: concreteTex,
            roughness: 0.9,
            metalness: 0.05
        });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.08, baseHeight, 22), baseMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const footing = new THREE.Mesh(
            new THREE.BoxGeometry(baseRadius * 1.4, 0.08, baseRadius * 1.1),
            new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.8, metalness: 0.1 })
        );
        footing.position.y = 0.04;
        footing.castShadow = true;
        footing.receiveShadow = true;
        group.add(footing);

        const coreTexture = this.createEnergyTexture();
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x0b1220,
            map: coreTexture,
            emissive: new THREE.Color(0x37f5ff),
            emissiveIntensity: 0.45,
            roughness: 0.35,
            metalness: 0.6
        });
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.25, 18), coreMat);
        core.position.y = baseHeight + 0.65;
        core.castShadow = true;
        core.receiveShadow = true;
        group.add(core);

        const capMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.7 });
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.14, 18), capMat);
        cap.position.y = baseHeight + 1.28;
        cap.castShadow = true;
        group.add(cap);

        const coilMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.4,
            metalness: 0.8
        });
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 10, 28), coilMat);
        coil.rotation.x = Math.PI / 2;
        coil.position.y = baseHeight + 1.04;
        group.add(coil);

        const beamTexture = this.createBeamTexture();
        const beamMat = new THREE.MeshStandardMaterial({
            map: beamTexture,
            color: 0x7ef9ff,
            transparent: true,
            opacity: 0.55,
            emissive: new THREE.Color(0x7ef9ff),
            emissiveIntensity: 1.1,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.1, 20, 1, true), beamMat);
        beam.position.y = baseHeight + 0.78;
        group.add(beam);
        this._glowMaterials.push(beamMat, coreMat);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = baseHeight + 1.08;
        this._ringGroup = ringGroup;
        group.add(ringGroup);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x4be7ff,
            emissive: new THREE.Color(0x4be7ff),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.85,
            metalness: 0.2,
            roughness: 0.15
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.07, 12, 48), ringMat);
        ring.rotation.x = Math.PI / 2;
        ringGroup.add(ring);
        this._glowMaterials.push(ringMat);

        const haloMat = new THREE.MeshStandardMaterial({
            color: 0x93f8ff,
            emissive: new THREE.Color(0x93f8ff),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.02, 8, 40), haloMat);
        halo.rotation.x = Math.PI / 2;
        ringGroup.add(halo);
        this._glowMaterials.push(haloMat);

        const finMat = new THREE.MeshStandardMaterial({
            color: 0x0ea5e9,
            emissive: new THREE.Color(0x0ea5e9),
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const finGeo = new THREE.PlaneGeometry(0.4, 0.65);
        for (let i = 0; i < 6; i += 1) {
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(Math.cos((Math.PI * 2 / 6) * i) * 0.7, 0, Math.sin((Math.PI * 2 / 6) * i) * 0.7);
            fin.lookAt(0, 0, 0);
            ringGroup.add(fin);
        }
        this._glowMaterials.push(finMat);

        const orbitGroup = new THREE.Group();
        orbitGroup.position.y = baseHeight + 0.95;
        this._orbitGroup = orbitGroup;
        group.add(orbitGroup);

        const orbMat = new THREE.MeshStandardMaterial({
            color: 0x7df9ff,
            emissive: new THREE.Color(0x7df9ff),
            emissiveIntensity: 1.4
        });
        for (let i = 0; i < 3; i += 1) {
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), orbMat);
            const angle = (Math.PI * 2 / 3) * i;
            orb.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.08, Math.sin(angle) * 0.5);
            orbitGroup.add(orb);
        }
        this._glowMaterials.push(orbMat);

        this._liftHeight = baseHeight + 1.08;

        return group;
    }

    createEnergyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a1522';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(73, 239, 255, 0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
            const y = 20 + i * 28;
            ctx.beginPath();
            ctx.moveTo(12, y);
            ctx.lineTo(canvas.width - 12, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(90, 255, 255, 0.25)';
        for (let i = 0; i < 6; i += 1) {
            const x = 20 + i * 36;
            ctx.beginPath();
            ctx.moveTo(x, 16);
            ctx.lineTo(x, canvas.height - 16);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(120, 255, 255, 0.18)';
        for (let i = 0; i < 50; i += 1) {
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 1 + Math.random() * 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    createBeamTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, 'rgba(125, 249, 255, 0.05)');
        gradient.addColorStop(0.4, 'rgba(125, 249, 255, 0.7)');
        gradient.addColorStop(0.6, 'rgba(125, 249, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(125, 249, 255, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 24; i += 1) {
            const y = 8 + i * 10;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    update(dt) {
        this._time += dt;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += this._spinSpeed * dt;
            this._ringGroup.position.y = this._liftHeight + Math.sin(this._time * 1.4) * 0.05;
        }

        if (this._orbitGroup) {
            this._orbitGroup.rotation.y -= this._spinSpeed * 1.4 * dt;
            this._orbitGroup.rotation.x = Math.sin(this._time * 0.8) * 0.2;
        }

        if (this._glowMaterials.length) {
            const pulse = 0.6 + 0.4 * Math.sin(this._time * this._pulseSpeed);
            this._glowMaterials.forEach((material) => {
                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = 0.6 + pulse * 1.1;
                }
                if (material.opacity !== undefined && material.transparent) {
                    material.opacity = THREE.MathUtils.clamp(0.35 + pulse * 0.5, 0.25, 0.95);
                }
            });
        }
    }
}

EntityRegistry.register('pulseReactor', PulseReactorEntity);
