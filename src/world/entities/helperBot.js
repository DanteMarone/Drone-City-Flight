import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [0x4ad6ff, 0xff5fd1, 0x7cff6b, 0xffc857];

export class HelperBotEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.accentColor === undefined) {
            params.accentColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        }
        super(params);
        this.type = 'helperBot';
        this.timer = Math.random() * 10;
        this.floatSpeed = params.floatSpeed ?? 1.6 + Math.random() * 0.6;
        this.spinSpeed = params.spinSpeed ?? 1.2 + Math.random() * 0.4;
        this.pulseSpeed = params.pulseSpeed ?? 2.2 + Math.random() * 0.6;
    }

    createMesh(params) {
        const group = new THREE.Group();
        const accent = new THREE.Color(params.accentColor ?? ACCENT_COLORS[0]);

        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2f343f, roughness: 0.8, metalness: 0.2 });
        const shellMat = new THREE.MeshStandardMaterial({ color: 0x5f6a7a, roughness: 0.4, metalness: 0.6 });
        const coreMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: accent,
            emissiveIntensity: 0.7,
            roughness: 0.4,
            metalness: 0.2
        });

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.12, 18), baseMat);
        pedestal.position.y = 0.06;
        group.add(pedestal);

        const hoverRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 12, 24), coreMat);
        hoverRing.rotation.x = Math.PI / 2;
        hoverRing.position.y = 0.18;
        group.add(hoverRing);

        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 20), shellMat);
        shell.position.y = 0.55;
        group.add(shell);

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), coreMat);
        core.position.y = 0.55;
        group.add(core);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), shellMat);
        visor.position.set(0, 0.55, 0.26);
        group.add(visor);

        const faceTexture = this._createFaceTexture(accent);
        const faceMat = new THREE.MeshStandardMaterial({
            map: faceTexture,
            emissive: accent,
            emissiveIntensity: 0.6,
            roughness: 0.4
        });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.14), faceMat);
        face.position.set(0, 0.55, 0.33);
        group.add(face);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12), shellMat);
        antenna.position.set(0, 0.84, -0.06);
        group.add(antenna);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), coreMat);
        beacon.position.set(0, 0.95, -0.06);
        group.add(beacon);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 12, 18), coreMat);
        halo.position.set(0, 0.88, 0.18);
        halo.rotation.x = Math.PI / 2;
        group.add(halo);

        const helperBadge = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), faceMat);
        helperBadge.position.set(0, 0.28, 0.02);
        helperBadge.rotation.x = -Math.PI / 2;
        group.add(helperBadge);

        group.userData.core = core;
        group.userData.ring = hoverRing;
        group.userData.halo = halo;
        group.userData.beacon = beacon;

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(accent) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0b0f18';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2b3342';
        ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);

        ctx.fillStyle = '#e6f4ff';
        ctx.beginPath();
        ctx.arc(40, 32, 8, 0, Math.PI * 2);
        ctx.arc(88, 32, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e6f4ff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(64, 40, 18, 0, Math.PI);
        ctx.stroke();

        ctx.fillStyle = `#${accent.getHexString()}`;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('?', 58, 26);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this.timer += dt;

        if (this.mesh.userData.baseY === undefined) {
            this.mesh.userData.baseY = this.mesh.position.y;
        }

        const floatOffset = Math.sin(this.timer * this.floatSpeed) * 0.08;
        this.mesh.position.y = this.mesh.userData.baseY + floatOffset;

        const ring = this.mesh.userData.ring;
        if (ring) {
            ring.rotation.z += dt * this.spinSpeed;
            ring.material.emissiveIntensity = 0.6 + Math.sin(this.timer * this.pulseSpeed) * 0.2;
        }

        const halo = this.mesh.userData.halo;
        if (halo) {
            halo.rotation.z -= dt * (this.spinSpeed * 0.8);
        }

        const core = this.mesh.userData.core;
        if (core) {
            core.material.emissiveIntensity = 0.55 + Math.sin(this.timer * this.pulseSpeed + 0.8) * 0.25;
        }

        const beacon = this.mesh.userData.beacon;
        if (beacon) {
            beacon.material.emissiveIntensity = 0.7 + Math.sin(this.timer * (this.pulseSpeed + 0.6)) * 0.3;
        }
    }

    static get displayName() {
        return 'Helper Bot';
    }
}

EntityRegistry.register('helperBot', HelperBotEntity);
