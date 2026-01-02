import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SawbladeDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sawbladeDrone';
        this._time = Math.random() * Math.PI * 2;
        this._ringGroup = null;
        this._glowMaterials = [];
        this._hoverSpeed = params.hoverSpeed ?? (2.2 + Math.random() * 0.6);
        this._spinSpeed = params.spinSpeed ?? (1.6 + Math.random() * 0.6);
        this._pulseSpeed = params.pulseSpeed ?? (3 + Math.random() * 0.8);
        this._baseY = params.y ?? 0;
    }

    static get displayName() {
        return 'Sawblade Drone';
    }

    createHazardTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#121417';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(canvas.width / 2, canvas.height / 2);
        const stripeCount = 12;
        for (let i = 0; i < stripeCount; i += 1) {
            ctx.save();
            ctx.rotate((i / stripeCount) * Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#f5b13b' : '#6b2e1b';
            ctx.fillRect(0, -12, canvas.width / 2, 24);
            ctx.restore();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createMesh(params) {
        const group = new THREE.Group();

        const coreRadius = params.coreRadius ?? 0.38 + Math.random() * 0.08;
        const ringRadius = params.ringRadius ?? coreRadius + 0.32;
        const ringTube = params.ringTube ?? 0.06;
        const accentColor = new THREE.Color(params.accentColor ?? 0xff3b30);

        this.params.coreRadius = coreRadius;
        this.params.ringRadius = ringRadius;
        this.params.ringTube = ringTube;
        this.params.spinSpeed = this._spinSpeed;
        this.params.hoverSpeed = this._hoverSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const shellMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.45,
            metalness: 0.7
        });
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            emissive: accentColor,
            emissiveIntensity: 0.6,
            roughness: 0.25,
            metalness: 0.4
        });

        const coreShell = new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 18, 18), shellMat);
        coreShell.castShadow = true;
        coreShell.receiveShadow = true;
        group.add(coreShell);

        const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(coreRadius * 0.62, 16, 16), coreMat);
        coreGlow.position.z = coreRadius * 0.4;
        group.add(coreGlow);
        this._glowMaterials.push(coreMat);

        const hazardMat = new THREE.MeshStandardMaterial({
            map: this.createHazardTexture(),
            roughness: 0.7,
            metalness: 0.2
        });
        const belly = new THREE.Mesh(new THREE.CylinderGeometry(coreRadius * 0.85, coreRadius * 0.95, 0.16, 18), hazardMat);
        belly.position.y = -coreRadius * 0.55;
        group.add(belly);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = 0.05;
        this._ringGroup = ringGroup;
        group.add(ringGroup);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x374151,
            roughness: 0.35,
            metalness: 0.85
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, ringTube, 12, 36), ringMat);
        ring.rotation.x = Math.PI / 2;
        ringGroup.add(ring);

        const spikeMat = new THREE.MeshStandardMaterial({
            color: 0xb91c1c,
            roughness: 0.3,
            metalness: 0.5,
            emissive: new THREE.Color(0x4b0d0d),
            emissiveIntensity: 0.3
        });
        this._glowMaterials.push(spikeMat);

        const spikeGeo = new THREE.ConeGeometry(0.09, 0.32, 8);
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i += 1) {
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            const angle = (i / spikeCount) * Math.PI * 2;
            spike.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
            spike.rotation.x = Math.PI / 2;
            spike.rotation.z = angle;
            ringGroup.add(spike);
        }

        const ventMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.6,
            metalness: 0.5
        });
        const ventGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.18, 12);
        const ventOffsets = [
            new THREE.Vector3(0.18, -0.1, 0.2),
            new THREE.Vector3(-0.18, -0.1, 0.2),
            new THREE.Vector3(0.18, -0.1, -0.2),
            new THREE.Vector3(-0.18, -0.1, -0.2)
        ];
        ventOffsets.forEach((offset) => {
            const vent = new THREE.Mesh(ventGeo, ventMat);
            vent.position.copy(offset);
            vent.rotation.x = Math.PI / 2;
            group.add(vent);
        });

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    createCollider() {
        if (!this.mesh) return null;
        this.mesh.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(this.mesh);
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;

        const hover = Math.sin(this._time * this._hoverSpeed) * 0.08;
        this.mesh.position.y = this._baseY + hover;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += dt * this._spinSpeed;
            this._ringGroup.rotation.x = Math.sin(this._time * 0.8) * 0.08;
        }

        const pulse = 0.45 + 0.35 * Math.sin(this._time * this._pulseSpeed);
        this._glowMaterials.forEach((material, index) => {
            material.emissiveIntensity = pulse + index * 0.08;
        });

        if (window.app?.colliderSystem && this.box) {
            this.box.setFromObject(this.mesh);
            window.app.colliderSystem.updateBody(this.mesh);
        }
    }
}

EntityRegistry.register('sawbladeDrone', SawbladeDroneEntity);
