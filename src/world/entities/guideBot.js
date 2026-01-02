import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const PALETTES = [
    { body: 0x6aa7ff, accent: 0x22f0ff, visor: 0x17253a },
    { body: 0xffb86b, accent: 0x6bffb8, visor: 0x2c1b0e },
    { body: 0xb86bff, accent: 0xff6bd6, visor: 0x23102c },
    { body: 0x7be07f, accent: 0x44ffd1, visor: 0x13271f }
];

export class GuideBotEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.paletteIndex === undefined) params.paletteIndex = Math.floor(Math.random() * PALETTES.length);
        super(params);
        this.type = 'guideBot';
        this.floatSpeed = params.floatSpeed ?? 1.6 + Math.random() * 0.6;
        this.spinSpeed = params.spinSpeed ?? 0.6 + Math.random() * 0.3;
        this.pulseSpeed = params.pulseSpeed ?? 2.2 + Math.random() * 0.6;
        this.timer = Math.random() * 10;
    }

    createMesh(params) {
        const palette = PALETTES[(params.paletteIndex ?? 0) % PALETTES.length];
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.55, metalness: 0.2 });
        const accentMat = new THREE.MeshStandardMaterial({
            color: palette.accent,
            emissive: palette.accent,
            emissiveIntensity: 0.6,
            roughness: 0.3
        });
        const visorMat = new THREE.MeshStandardMaterial({ color: palette.visor, roughness: 0.6, metalness: 0.1 });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.35, 18), bodyMat);
        base.position.y = 0.18;
        group.add(base);

        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 8, 16), bodyMat);
        torso.position.y = 0.85;
        group.add(torso);

        const headMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.5 });
        headMat.map = this._createFaceTexture(palette.accent);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), headMat);
        head.position.y = 1.32;
        group.add(head);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.18), visorMat);
        visor.position.set(0, 1.3, 0.18);
        group.add(visor);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), bodyMat);
        antenna.position.set(0.15, 1.62, -0.05);
        antenna.rotation.z = 0.2;
        group.add(antenna);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), accentMat);
        beacon.position.set(0.2, 1.78, -0.05);
        group.add(beacon);

        const armGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const armLeft = new THREE.Mesh(armGeo, bodyMat);
        armLeft.position.set(0.34, 0.95, 0.1);
        armLeft.rotation.z = 0.3;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, bodyMat);
        armRight.position.set(-0.34, 0.95, 0.1);
        armRight.rotation.z = -0.3;
        group.add(armRight);

        const holo = this._createHoloPanel(palette.accent);
        holo.position.set(0, 1.05, 0.38);
        group.add(holo);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 12, 32), accentMat);
        ring.position.y = 1.45;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const helperGlow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), accentMat);
        helperGlow.rotation.x = -Math.PI / 2;
        helperGlow.position.y = 0.02;
        helperGlow.scale.set(1, 1, 1);
        group.add(helperGlow);

        group.userData.ring = ring;
        group.userData.holo = holo;
        group.userData.beacon = beacon;
        group.userData.glow = helperGlow;

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0c1a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e9f7ff';
        ctx.beginPath();
        ctx.arc(44, 58, 10, 0, Math.PI * 2);
        ctx.arc(84, 58, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e9f7ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 88, 20, 0, Math.PI);
        ctx.stroke();

        ctx.strokeStyle = `#${new THREE.Color(accentColor).getHexString()}`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(20, 24);
        ctx.lineTo(108, 24);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    _createHoloPanel(accentColor) {
        const group = new THREE.Group();
        const panelMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.55,
            roughness: 0.2
        });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), panelMat);
        panel.rotation.y = Math.PI;
        group.add(panel);

        const mapMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: accentColor,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.7
        });
        mapMat.map = this._createMapTexture(accentColor);
        const map = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.3), mapMat);
        map.position.z = 0.01;
        map.rotation.y = Math.PI;
        group.add(map);

        return group;
    }

    _createMapTexture(accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#06131f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#1c3a52';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 128; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 128);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(128, i);
            ctx.stroke();
        }

        ctx.strokeStyle = `#${new THREE.Color(accentColor).getHexString()}`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(32, 64);
        ctx.lineTo(64, 32);
        ctx.lineTo(96, 56);
        ctx.stroke();

        ctx.fillStyle = '#f2ffe8';
        ctx.beginPath();
        ctx.arc(96, 56, 6, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this.timer += dt;

        const bob = Math.sin(this.timer * this.floatSpeed) * 0.05;
        this.mesh.position.y = this.position.y + bob;

        const ring = this.mesh.userData.ring;
        if (ring) {
            ring.rotation.z += dt * this.spinSpeed;
            const pulse = 1 + Math.sin(this.timer * this.pulseSpeed) * 0.08;
            ring.scale.set(pulse, pulse, pulse);
            if (ring.material) {
                ring.material.emissiveIntensity = 0.55 + Math.sin(this.timer * this.pulseSpeed) * 0.2;
            }
        }

        const holo = this.mesh.userData.holo;
        if (holo) {
            holo.rotation.y = Math.PI + Math.sin(this.timer * 1.2) * 0.15;
        }

        const beacon = this.mesh.userData.beacon;
        if (beacon && beacon.material) {
            beacon.material.emissiveIntensity = 0.7 + Math.sin(this.timer * 3.2) * 0.4;
        }

        const glow = this.mesh.userData.glow;
        if (glow && glow.material) {
            glow.material.emissiveIntensity = 0.5 + Math.sin(this.timer * 2.4) * 0.2;
        }
    }

    static get displayName() {
        return 'Guide Bot';
    }
}

EntityRegistry.register('guideBot', GuideBotEntity);
