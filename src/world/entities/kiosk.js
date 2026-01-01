import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const PANEL_COLORS = [0x2563eb, 0x7c3aed, 0xf97316, 0x14b8a6];

const createKioskTexture = (accent = '#38bdf8') => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(18, 28, canvas.width - 36, canvas.height - 46);

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
        const y = 48 + i * 32;
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(canvas.width - 28, y);
        ctx.stroke();
    }

    ctx.fillStyle = '#1f3a5f';
    const blocks = [
        { x: 36, y: 70, w: 70, h: 52 },
        { x: 118, y: 70, w: 92, h: 36 },
        { x: 118, y: 112, w: 92, h: 48 },
        { x: 36, y: 128, w: 70, h: 60 },
        { x: 36, y: 200, w: 60, h: 42 },
        { x: 104, y: 196, w: 108, h: 56 },
        { x: 36, y: 254, w: 174, h: 42 }
    ];

    blocks.forEach((block, index) => {
        const color = index % 2 === 0 ? '#243b5a' : '#1e2f4f';
        ctx.fillStyle = color;
        ctx.fillRect(block.x, block.y, block.w, block.h);
    });

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(36, 156, 174, 18);

    ctx.fillStyle = accent;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MALL MAP', 28, 24);

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(195, 234, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('YOU ARE HERE', canvas.width - 22, canvas.height - 16);

    for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(36 + Math.random() * 170, 60 + Math.random() * 210, 6, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
};

export class KioskEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'kiosk';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._glowMaterials = [];
        this._spinner = null;
        this._accent = null;
    }

    static get displayName() { return 'Kiosk'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 2.1;
        this.params.height = height;

        const accent = params.accent || PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];
        this._accent = accent;

        const baseTexture = TextureGenerator.createConcrete();
        baseTexture.repeat.set(1.2, 1.2);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2b2f36,
            map: baseTexture,
            roughness: 0.8,
            metalness: 0.15
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.18, 20), baseMat);
        base.position.y = 0.09;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.5,
            metalness: 0.4
        });
        const column = new THREE.Mesh(new THREE.BoxGeometry(0.38, height, 0.32), columnMat);
        column.position.y = height / 2 + 0.18;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const accentMat = new THREE.MeshStandardMaterial({
            color: accent,
            roughness: 0.4,
            metalness: 0.6
        });
        const accentBand = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.36), accentMat);
        accentBand.position.y = height * 0.78 + 0.22;
        group.add(accentBand);

        const screenGroup = new THREE.Group();
        screenGroup.position.set(0, height * 0.55 + 0.25, 0.2);
        screenGroup.rotation.x = -Math.PI / 7;
        group.add(screenGroup);

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.55,
            metalness: 0.45
        });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.86, 0.08), frameMat);
        frame.castShadow = true;
        screenGroup.add(frame);

        const screenTexture = createKioskTexture(`#${accent.toString(16).padStart(6, '0')}`);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(0x6ee7ff),
            emissiveIntensity: 0.9,
            roughness: 0.35,
            metalness: 0.2
        });

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.74), this._screenMaterial);
        screen.position.z = 0.05;
        screenGroup.add(screen);

        const sideGlowMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.6,
            roughness: 0.4,
            metalness: 0.6
        });
        this._glowMaterials.push(sideGlowMat);

        const sidePanelGeo = new THREE.BoxGeometry(0.08, 0.7, 0.24);
        const leftPanel = new THREE.Mesh(sidePanelGeo, sideGlowMat);
        leftPanel.position.set(-0.47, height * 0.5 + 0.26, 0);
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(sidePanelGeo, sideGlowMat);
        rightPanel.position.set(0.47, height * 0.5 + 0.26, 0);
        group.add(rightPanel);

        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.3
        });
        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 16), canopyMat);
        canopy.position.y = height + 0.34;
        canopy.castShadow = true;
        group.add(canopy);

        const ringMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 1.1,
            roughness: 0.4,
            metalness: 0.6
        });
        this._glowMaterials.push(ringMat);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 12, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = height + 0.38;
        group.add(ring);

        const spinnerGroup = new THREE.Group();
        spinnerGroup.position.y = height + 0.46;
        group.add(spinnerGroup);
        this._spinner = spinnerGroup;

        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            emissive: new THREE.Color(0xf8fafc),
            emissiveIntensity: 0.6
        });
        this._glowMaterials.push(arrowMat);

        const arrowBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), arrowMat);
        arrowBase.position.z = 0.08;
        spinnerGroup.add(arrowBase);

        const arrowTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 16), arrowMat);
        arrowTip.rotation.x = Math.PI / 2;
        arrowTip.position.z = 0.2;
        spinnerGroup.add(arrowTip);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), ringMat);
        beacon.position.y = height + 0.22;
        group.add(beacon);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;

        if (this._spinner) {
            this._spinner.rotation.y += dt * 0.8;
            this._spinner.position.y = (this.params.height || 2.1) + 0.46 + Math.sin(this._time * 2.4) * 0.02;
        }

        const pulse = 0.35 + 0.2 * Math.sin(this._time * 3.2);
        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 0.75 + pulse;
        }

        this._glowMaterials.forEach((material) => {
            if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity = 0.6 + pulse * 0.9;
            }
        });
    }
}

EntityRegistry.register('kiosk', KioskEntity);
