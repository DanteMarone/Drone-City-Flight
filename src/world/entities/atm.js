import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [0x38bdf8, 0x22c55e, 0xa855f7, 0xf97316];

const createScreenTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0b1220');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(20, 20, 216, 32);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('CITY BANK', 30, 36);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(28, 80, 200, 18);
    ctx.fillRect(28, 108, 200, 18);
    ctx.fillRect(28, 136, 200, 18);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(28, 176, 90, 32);
    ctx.fillRect(138, 176, 90, 32);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WITHDRAW', 73, 193);
    ctx.fillText('DEPOSIT', 183, 193);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

const createLogoTexture = (accent) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, 256, 96);

    ctx.strokeStyle = `#${accent.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 84);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ATM', 128, 50);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

export class ATMEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'atm';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._indicatorMaterial = null;
        this._accentColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    }

    static get displayName() { return 'ATM'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 1.1;
        const depth = params.depth || 0.7;
        const height = params.height || 2.1;
        const baseHeight = 0.1;
        const bodyHeight = height - baseHeight;

        const concreteTexture = TextureGenerator.createConcrete();
        concreteTexture.wrapS = THREE.RepeatWrapping;
        concreteTexture.wrapT = THREE.RepeatWrapping;
        concreteTexture.repeat.set(1.6, 1.8);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.8,
            metalness: 0.2
        });

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            map: concreteTexture,
            roughness: 0.55,
            metalness: 0.3
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, baseHeight, depth * 1.05), baseMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, depth), bodyMat);
        body.position.y = baseHeight + bodyHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.35,
            metalness: 0.6
        });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, bodyHeight * 0.85, depth * 0.22), panelMat);
        panel.position.set(0, baseHeight + bodyHeight * 0.55, depth / 2 - depth * 0.11);
        panel.castShadow = true;
        group.add(panel);

        const screenTexture = createScreenTexture();
        this._screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(this._accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.25,
            metalness: 0.2
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.62, bodyHeight * 0.28), this._screenMaterial);
        screen.position.set(0, baseHeight + bodyHeight * 0.78, depth / 2 + 0.01);
        group.add(screen);

        const keypadMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.4
        });
        const keypad = new THREE.Mesh(new THREE.BoxGeometry(width * 0.46, bodyHeight * 0.18, depth * 0.08), keypadMat);
        keypad.position.set(0, baseHeight + bodyHeight * 0.54, depth / 2 + 0.02);
        keypad.castShadow = true;
        group.add(keypad);

        const buttonMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.5,
            metalness: 0.1
        });
        const buttonGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12);
        const buttonRows = 4;
        const buttonCols = 3;
        const buttonOffsetX = -0.12;
        const buttonOffsetY = -0.05;
        for (let row = 0; row < buttonRows; row += 1) {
            for (let col = 0; col < buttonCols; col += 1) {
                const button = new THREE.Mesh(buttonGeo, buttonMat);
                button.rotation.x = Math.PI / 2;
                button.position.set(
                    buttonOffsetX + col * 0.09,
                    baseHeight + bodyHeight * 0.54 + buttonOffsetY + row * 0.045,
                    depth / 2 + 0.05
                );
                group.add(button);
            }
        }

        const slotMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.4,
            metalness: 0.7,
            emissive: new THREE.Color(this._accentColor),
            emissiveIntensity: 0.4
        });
        const cardSlot = new THREE.Mesh(new THREE.BoxGeometry(width * 0.28, 0.03, 0.05), slotMat);
        cardSlot.position.set(0, baseHeight + bodyHeight * 0.62, depth / 2 + 0.03);
        group.add(cardSlot);

        const cashSlot = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.05, 0.06), slotMat);
        cashSlot.position.set(0, baseHeight + bodyHeight * 0.42, depth / 2 + 0.03);
        group.add(cashSlot);

        const indicatorMat = new THREE.MeshStandardMaterial({
            color: this._accentColor,
            emissive: new THREE.Color(this._accentColor),
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.1
        });
        this._indicatorMaterial = indicatorMat;
        const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), indicatorMat);
        indicator.position.set(width * 0.28, baseHeight + bodyHeight * 0.78, depth / 2 + 0.03);
        group.add(indicator);

        const logoTexture = createLogoTexture(this._accentColor);
        const logoMat = new THREE.MeshStandardMaterial({
            map: logoTexture,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 1.0,
            roughness: 0.3,
            metalness: 0.2
        });
        const logoPanel = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.65, 0.28), logoMat);
        logoPanel.position.set(0, baseHeight + bodyHeight + 0.06, depth / 2 + 0.01);
        group.add(logoPanel);

        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.4,
            metalness: 0.3
        });
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.08, depth * 0.5), canopyMat);
        canopy.position.set(0, baseHeight + bodyHeight + 0.02, depth * 0.15);
        canopy.castShadow = true;
        group.add(canopy);

        const sidePanelMat = new THREE.MeshStandardMaterial({
            color: 0x374151,
            roughness: 0.6,
            metalness: 0.4
        });
        const sidePanelGeo = new THREE.BoxGeometry(width * 0.08, bodyHeight * 0.7, depth * 0.75);
        const leftPanel = new THREE.Mesh(sidePanelGeo, sidePanelMat);
        leftPanel.position.set(-width * 0.5 + width * 0.04, baseHeight + bodyHeight * 0.6, 0);
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(sidePanelGeo, sidePanelMat);
        rightPanel.position.set(width * 0.5 - width * 0.04, baseHeight + bodyHeight * 0.6, 0);
        group.add(rightPanel);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._screenMaterial) {
            const pulse = 0.75 + Math.sin(this._time * 2.2) * 0.15;
            this._screenMaterial.emissiveIntensity = pulse;
        }
        if (this._indicatorMaterial) {
            const blink = 1.0 + Math.sin(this._time * 4.5) * 0.4;
            this._indicatorMaterial.emissiveIntensity = blink;
        }
    }
}

EntityRegistry.register('atm', ATMEntity);
