import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const PANEL_COLORS = [
    0x5b6472,
    0x6b7280,
    0x4b5563
];

const ACCENT_COLORS = [
    0x38bdf8,
    0xf97316,
    0xa855f7
];

const createLockerTexture = ({ rows, cols, baseColor, highlight }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const doorWidth = canvas.width / cols;
    const doorHeight = canvas.height / rows;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#111827';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * doorWidth;
            const y = row * doorHeight;
            const hueShift = (row + col) % 2 === 0 ? 10 : -8;
            const doorColor = new THREE.Color(baseColor).offsetHSL(0, 0, hueShift / 100);
            ctx.fillStyle = `#${doorColor.getHexString()}`;
            ctx.fillRect(x + 4, y + 4, doorWidth - 8, doorHeight - 8);

            ctx.strokeRect(x + 4, y + 4, doorWidth - 8, doorHeight - 8);

            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x + doorWidth * 0.65, y + doorHeight * 0.45, doorWidth * 0.18, doorHeight * 0.12);

            ctx.fillStyle = '#e5e7eb';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const label = `${row + 1}${String.fromCharCode(65 + col)}`;
            ctx.fillText(label, x + 10, y + 10);
        }
    }

    ctx.strokeStyle = `#${highlight.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export class ParcelLockerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parcelLocker';
        this._pulseTime = Math.random() * Math.PI * 2;
        this._indicatorMaterial = null;
    }

    static get displayName() { return 'Parcel Locker'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.4;
        const height = params.height || 1.8;
        const depth = params.depth || 0.6;
        const rows = params.rows || 3;
        const cols = params.cols || 4;

        this.params.width = width;
        this.params.height = height;
        this.params.depth = depth;
        this.params.rows = rows;
        this.params.cols = cols;

        const panelColor = params.panelColor || PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        const bodyMat = new THREE.MeshStandardMaterial({
            color: panelColor,
            roughness: 0.55,
            metalness: 0.5
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.8,
            metalness: 0.2
        });

        const baseHeight = 0.12;
        const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, baseHeight, depth * 1.05), baseMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
        body.position.y = baseHeight + height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.12, depth * 1.1), baseMat);
        canopy.position.y = baseHeight + height + 0.06;
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        group.add(canopy);

        const panelTexture = createLockerTexture({
            rows,
            cols,
            baseColor: new THREE.Color(panelColor).offsetHSL(0, -0.05, 0.12).getHex(),
            highlight: accentColor
        });
        const panelMat = new THREE.MeshStandardMaterial({
            map: panelTexture,
            roughness: 0.6,
            metalness: 0.2
        });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.94, height * 0.86), panelMat);
        panel.position.set(0, baseHeight + height * 0.52, depth / 2 + 0.01);
        group.add(panel);

        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 1.2,
            roughness: 0.4,
            metalness: 0.2
        });
        const screen = new THREE.Mesh(new THREE.BoxGeometry(width * 0.22, height * 0.18, 0.03), screenMat);
        screen.position.set(-width * 0.27, baseHeight + height * 0.72, depth / 2 + 0.035);
        screen.castShadow = true;
        group.add(screen);

        const keypadMat = new THREE.MeshStandardMaterial({
            color: 0x2d3748,
            roughness: 0.6,
            metalness: 0.3
        });
        const keypad = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, height * 0.14, 0.03), keypadMat);
        keypad.position.set(-width * 0.27, baseHeight + height * 0.52, depth / 2 + 0.035);
        keypad.castShadow = true;
        group.add(keypad);

        const buttonGeo = new THREE.BoxGeometry(width * 0.035, height * 0.03, 0.01);
        for (let i = 0; i < 6; i++) {
            const button = new THREE.Mesh(buttonGeo, baseMat);
            const row = Math.floor(i / 3);
            const col = i % 3;
            button.position.set(
                keypad.position.x - width * 0.05 + col * width * 0.05,
                keypad.position.y + height * 0.03 - row * height * 0.04,
                depth / 2 + 0.05
            );
            group.add(button);
        }

        this._indicatorMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.6,
            roughness: 0.4,
            metalness: 0.2
        });
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(width * 0.22, 0.04, 0.04), this._indicatorMaterial);
        indicator.position.set(width * 0.28, baseHeight + height * 0.76, depth / 2 + 0.04);
        indicator.castShadow = true;
        group.add(indicator);

        const ventMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.7,
            metalness: 0.3
        });
        const vent = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, height * 0.22, 0.04), ventMat);
        vent.position.set(width * 0.3, baseHeight + height * 0.45, -depth / 2 - 0.02);
        vent.castShadow = true;
        group.add(vent);

        const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const footOffsets = [
            [-width / 2 + 0.18, baseHeight / 2, -depth / 2 + 0.18],
            [width / 2 - 0.18, baseHeight / 2, -depth / 2 + 0.18],
            [-width / 2 + 0.18, baseHeight / 2, depth / 2 - 0.18],
            [width / 2 - 0.18, baseHeight / 2, depth / 2 - 0.18]
        ];
        footOffsets.forEach(([x, y, z]) => {
            const foot = new THREE.Mesh(footGeo, baseMat);
            foot.position.set(x, y, z);
            foot.castShadow = true;
            foot.receiveShadow = true;
            group.add(foot);
        });

        return group;
    }

    update(dt) {
        if (!this._indicatorMaterial) return;
        this._pulseTime += dt;
        const pulse = 0.6 + Math.sin(this._pulseTime * 2.6) * 0.35;
        this._indicatorMaterial.emissiveIntensity = THREE.MathUtils.clamp(pulse, 0.2, 1.2);
    }
}

EntityRegistry.register('parcelLocker', ParcelLockerEntity);
