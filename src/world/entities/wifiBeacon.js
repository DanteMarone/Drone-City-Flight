import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const SIGNAL_COLORS = [
    0x5efcff,
    0xff7afc,
    0x7cff8a,
    0xffd65e
];

const METAL_COLORS = [
    0x1f2937,
    0x374151,
    0x4b5563,
    0x111827
];

export class WifiBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'wifiBeacon';
        this._time = Math.random() * Math.PI * 2;
        this._waveMeshes = [];
        this._glowMaterials = [];
    }

    static get displayName() { return 'Wi-Fi Beacon'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? (0.45 + Math.random() * 0.15);
        const baseHeight = params.baseHeight ?? (0.22 + Math.random() * 0.1);
        const columnHeight = params.columnHeight ?? (1.5 + Math.random() * 0.4);
        const columnRadius = params.columnRadius ?? (0.12 + Math.random() * 0.05);
        const headHeight = params.headHeight ?? (0.32 + Math.random() * 0.12);

        const signalColor = new THREE.Color(params.signalColor || SIGNAL_COLORS[Math.floor(Math.random() * SIGNAL_COLORS.length)]);
        const metalColor = params.metalColor || METAL_COLORS[Math.floor(Math.random() * METAL_COLORS.length)];

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.95,
            metalness: 0.1,
            map: TextureGenerator.createConcrete({ scale: 2 })
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: metalColor,
            roughness: 0.45,
            metalness: 0.8
        });

        const glowMaterial = new THREE.MeshStandardMaterial({
            color: signalColor,
            emissive: signalColor,
            emissiveIntensity: 1.3,
            roughness: 0.3,
            metalness: 0.1
        });
        this._glowMaterials.push(glowMaterial);

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 1.05, baseRadius, baseHeight, 18),
            baseMaterial
        );
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plinth = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.7, baseRadius * 0.8, baseHeight * 0.5, 16),
            metalMaterial
        );
        plinth.position.y = baseHeight + baseHeight * 0.25;
        plinth.castShadow = true;
        group.add(plinth);

        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(columnRadius, columnRadius * 1.05, columnHeight, 12),
            metalMaterial
        );
        column.position.y = baseHeight + columnHeight / 2;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(columnRadius * 1.45, 16, 16),
            glowMaterial
        );
        core.position.y = baseHeight + columnHeight * 0.75;
        core.castShadow = true;
        group.add(core);

        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(columnRadius * 1.4, columnRadius * 1.4, headHeight, 16),
            metalMaterial
        );
        head.position.y = baseHeight + columnHeight + headHeight / 2;
        head.castShadow = true;
        group.add(head);

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(columnRadius * 1.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            glowMaterial
        );
        dome.position.y = head.position.y + headHeight * 0.45;
        group.add(dome);

        const panelTexture = this.createWifiPanelTexture(signalColor);
        const panelMaterial = new THREE.MeshStandardMaterial({
            map: panelTexture,
            roughness: 0.4,
            metalness: 0.1
        });

        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(columnRadius * 2.4, columnRadius * 2.4),
            panelMaterial
        );
        panel.position.set(0, baseHeight + columnHeight * 0.45, columnRadius * 1.15);
        group.add(panel);

        const panelBack = new THREE.Mesh(
            new THREE.PlaneGeometry(columnRadius * 2.4, columnRadius * 2.4),
            panelMaterial
        );
        panelBack.position.set(0, baseHeight + columnHeight * 0.45, -columnRadius * 1.15);
        panelBack.rotation.y = Math.PI;
        group.add(panelBack);

        const ringOffsets = [0.12, 0.26, 0.4];
        ringOffsets.forEach((offset, index) => {
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: signalColor,
                emissive: signalColor,
                emissiveIntensity: 1.1,
                transparent: true,
                opacity: 0.6 - index * 0.1,
                roughness: 0.3,
                metalness: 0.1
            });
            this._glowMaterials.push(ringMaterial);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(columnRadius * (2 + index * 0.8), columnRadius * 0.15, 10, 24),
                ringMaterial
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = baseHeight + columnHeight + headHeight * 0.6 + offset;
            ring.userData.baseY = ring.position.y;
            ring.userData.phase = index * 1.1;
            this._waveMeshes.push(ring);
            group.add(ring);
        });

        return group;
    }

    createWifiPanelTexture(signalColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0b1220');
        ctx.fillStyle = gradient;
        ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        const signalHex = `#${signalColor.getHexString()}`;
        ctx.strokeStyle = signalHex;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 78, 38, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(64, 78, 26, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 78, 14, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = signalHex;
        ctx.beginPath();
        ctx.arc(64, 82, 6, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        return texture;
    }

    update(dt) {
        this._time += dt;
        const pulse = 1 + Math.sin(this._time * 2.1) * 0.25;

        for (const material of this._glowMaterials) {
            material.emissiveIntensity = 0.9 * pulse + 0.35;
        }

        this._waveMeshes.forEach((ring, index) => {
            const wave = Math.sin(this._time * 2.4 + ring.userData.phase);
            const scale = 1 + wave * 0.08;
            ring.scale.set(scale, scale, scale);
            ring.position.y = ring.userData.baseY + wave * 0.04;
            if (ring.material) {
                ring.material.opacity = 0.45 + (0.12 * (1 - index)) + wave * 0.1;
            }
        });
    }
}

EntityRegistry.register('wifiBeacon', WifiBeaconEntity);
