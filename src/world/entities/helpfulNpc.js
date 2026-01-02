import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [
    0x38bdf8,
    0x22d3ee,
    0xa855f7,
    0x4ade80,
    0xfacc15
];

const BODY_COLORS = [
    0x374151,
    0x1f2937,
    0x111827,
    0x475569
];

export class HelpfulNpcEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'helpfulNpc';
        this._time = Math.random() * Math.PI * 2;
        this._waveArm = null;
        this._floatGroup = null;
        this._haloRing = null;
        this._screenMaterial = null;
    }

    static get displayName() {
        return 'Helper Bot';
    }

    createMesh(params) {
        const group = new THREE.Group();

        const accentColor = params.accentColor ?? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        const bodyColor = params.bodyColor ?? BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)];
        const highlightColor = params.highlightColor ?? 0xe2e8f0;

        this.params.accentColor = accentColor;
        this.params.bodyColor = bodyColor;
        this.params.highlightColor = highlightColor;

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.55,
            metalness: 0.5
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.4
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.5, 0.18, 16),
            bodyMaterial
        );
        base.position.y = 0.09;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const chassis = new THREE.Mesh(
            new THREE.CylinderGeometry(0.38, 0.42, 0.85, 16),
            bodyMaterial
        );
        chassis.position.y = 0.62;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        group.add(chassis);

        const belt = new THREE.Mesh(
            new THREE.TorusGeometry(0.37, 0.05, 10, 20),
            accentMaterial
        );
        belt.rotation.x = Math.PI / 2;
        belt.position.y = 0.92;
        group.add(belt);

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 18, 18),
            new THREE.MeshStandardMaterial({ color: highlightColor, roughness: 0.45 })
        );
        head.position.y = 1.45;
        head.castShadow = true;
        group.add(head);

        const screenGeo = new THREE.PlaneGeometry(0.32, 0.22);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.35,
            metalness: 0.2,
            transparent: true
        });
        this._screenMaterial.map = this._createScreenTexture(accentColor);
        const screen = new THREE.Mesh(screenGeo, this._screenMaterial);
        screen.position.set(0, 1.45, 0.28);
        group.add(screen);

        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.25, 10),
            bodyMaterial
        );
        antenna.position.set(0, 1.8, -0.05);
        group.add(antenna);

        const antennaOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 12, 12),
            accentMaterial
        );
        antennaOrb.position.set(0, 1.95, -0.05);
        group.add(antennaOrb);

        const armGeo = new THREE.BoxGeometry(0.1, 0.45, 0.1);
        const armLeft = new THREE.Mesh(armGeo, bodyMaterial);
        armLeft.position.set(0.35, 1.12, 0.1);
        armLeft.rotation.x = -0.25;
        armLeft.rotation.z = -0.2;
        group.add(armLeft);

        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.24, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.4 })
        );
        pad.position.set(0.4, 0.92, 0.28);
        pad.rotation.x = -0.35;
        group.add(pad);

        const padScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, 0.2),
            new THREE.MeshStandardMaterial({
                color: 0x0b1324,
                emissive: new THREE.Color(accentColor),
                emissiveIntensity: 1.1,
                transparent: true,
                opacity: 0.95
            })
        );
        padScreen.material.map = this._createScreenTexture(accentColor, true);
        padScreen.position.set(0.4, 0.92, 0.31);
        padScreen.rotation.x = -0.35;
        group.add(padScreen);

        const armRight = new THREE.Mesh(armGeo, bodyMaterial);
        armRight.position.set(-0.35, 1.18, 0.05);
        armRight.rotation.x = -0.6;
        armRight.rotation.z = 0.4;
        armRight.userData.baseRotation = armRight.rotation.clone();
        this._waveArm = armRight;
        group.add(armRight);

        const floatGroup = new THREE.Group();
        floatGroup.position.set(0, 2.15, 0.05);
        this._floatGroup = floatGroup;
        group.add(floatGroup);

        const haloMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.5
        });
        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.04, 10, 28),
            haloMaterial
        );
        halo.rotation.x = Math.PI / 2;
        floatGroup.add(halo);
        this._haloRing = halo;

        const icon = new THREE.Mesh(
            new THREE.PlaneGeometry(0.28, 0.28),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: new THREE.Color(accentColor),
                emissiveIntensity: 1.3,
                transparent: true,
                opacity: 0.95
            })
        );
        icon.material.map = this._createIconTexture(accentColor);
        icon.position.y = 0.12;
        floatGroup.add(icon);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createScreenTexture(accentColor, compact = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0b1222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const accent = new THREE.Color(accentColor).getStyle();
        ctx.strokeStyle = accent;
        ctx.lineWidth = compact ? 8 : 10;
        ctx.beginPath();
        ctx.moveTo(22, 40);
        ctx.lineTo(106, 40);
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.font = compact ? 'bold 38px sans-serif' : 'bold 46px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HELP', 64, 80);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(24, 96, 80, 8);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    _createIconTexture(accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const accent = new THREE.Color(accentColor).getStyle();
        ctx.fillStyle = 'rgba(12, 18, 35, 0.8)';
        ctx.beginPath();
        ctx.arc(64, 64, 54, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = accent;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(64, 54, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(64, 92, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('i', 64, 52);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        this._time += dt;

        if (this._floatGroup) {
            this._floatGroup.position.y = 2.15 + Math.sin(this._time * 1.6) * 0.08;
        }

        if (this._haloRing) {
            this._haloRing.rotation.z += dt * 1.1;
        }

        if (this._waveArm?.userData.baseRotation) {
            const wave = Math.sin(this._time * 2.3) * 0.35;
            this._waveArm.rotation.x = this._waveArm.userData.baseRotation.x + wave;
            this._waveArm.rotation.z = this._waveArm.userData.baseRotation.z + wave * 0.4;
        }

        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 0.7 + Math.sin(this._time * 3.1) * 0.2;
        }
    }
}

EntityRegistry.register('helpfulNpc', HelpfulNpcEntity);
