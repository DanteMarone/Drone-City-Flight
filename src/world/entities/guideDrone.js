import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class GuideDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'guideDrone';
        this._time = 0;
        this._ring = null;
        this._pulseMaterials = [];
        this._basePosition = this.position.clone();
    }

    static get displayName() { return 'Guide Drone'; }

    createMesh(params) {
        const group = new THREE.Group();

        const palette = params.palette || [0x7dd3fc, 0x38bdf8, 0x0ea5e9, 0x22d3ee];
        const primary = palette[Math.floor(Math.random() * palette.length)];

        const bodyMat = new THREE.MeshStandardMaterial({
            color: primary,
            roughness: 0.35,
            metalness: 0.5
        });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const torsoMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.7,
            metalness: 0.2
        });
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 18), torsoMat);
        torso.position.y = -0.22;
        torso.castShadow = true;
        torso.receiveShadow = true;
        group.add(torso);

        const faceTexture = this.createFaceTexture();
        const faceMat = new THREE.MeshStandardMaterial({
            map: faceTexture,
            emissive: new THREE.Color(0x7dd3fc),
            emissiveIntensity: 0.9,
            transparent: true,
            roughness: 0.6,
            metalness: 0.1
        });
        this._pulseMaterials.push(faceMat);

        const face = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), faceMat);
        face.position.set(0, 0.02, 0.26);
        face.rotation.y = 0;
        group.add(face);

        const haloMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: new THREE.Color(0x38bdf8),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.85
        });
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 12, 48), haloMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.18;
        halo.castShadow = false;
        group.add(halo);
        this._pulseMaterials.push(haloMat);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x0ea5e9,
            emissive: new THREE.Color(0x0ea5e9),
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 10, 36), ringMat);
        ring.rotation.y = Math.PI / 4;
        ring.position.y = -0.05;
        group.add(ring);
        this._ring = ring;
        this._pulseMaterials.push(ringMat);

        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.4,
            metalness: 0.7
        });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 12), antennaMat);
        antenna.position.y = 0.42;
        group.add(antenna);

        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: new THREE.Color(0xfbbf24),
            emissiveIntensity: 1.4
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), beaconMat);
        beacon.position.y = 0.57;
        group.add(beacon);
        this._pulseMaterials.push(beaconMat);

        const finMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.6,
            metalness: 0.2
        });
        const finGeometry = new THREE.BoxGeometry(0.18, 0.04, 0.12);
        const finOffsets = [
            { x: 0.24, z: 0 },
            { x: -0.24, z: 0 },
            { x: 0, z: 0.24 },
            { x: 0, z: -0.24 }
        ];
        finOffsets.forEach(({ x, z }) => {
            const fin = new THREE.Mesh(finGeometry, finMat);
            fin.position.set(x, -0.18, z);
            fin.castShadow = true;
            group.add(fin);
        });

        return group;
    }

    createFaceTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(8, 47, 73, 0.75)';
        ctx.beginPath();
        ctx.arc(128, 128, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(128, 132, 70, 0, Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
        ctx.beginPath();
        ctx.arc(88, 110, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(168, 110, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 18; i += 1) {
            ctx.beginPath();
            ctx.moveTo(128, 20 + i * 12);
            ctx.lineTo(128 + (i % 2 === 0 ? 18 : -18), 20 + i * 12);
            ctx.stroke();
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
        const hover = Math.sin(this._time * 2.2 + (this.params.seed || 0)) * 0.06;
        this.mesh.position.y = this._basePosition.y + 0.45 + hover;

        this.mesh.rotation.y += dt * 0.4;

        if (this._ring) {
            this._ring.rotation.z += dt * 1.1;
        }

        if (this._pulseMaterials.length) {
            const pulse = 0.6 + Math.sin(this._time * 3.2) * 0.3;
            this._pulseMaterials.forEach((material) => {
                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = THREE.MathUtils.clamp(pulse, 0.4, 1.6);
                }
            });
        }
    }
}

EntityRegistry.register('guideDrone', GuideDroneEntity);
