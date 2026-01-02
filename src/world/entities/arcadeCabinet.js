import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [
    0x00d4ff,
    0xff4ed6,
    0x7bff6b,
    0xffc647,
    0x8c7bff
];

function createScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e2a5a');
    gradient.addColorStop(0.5, '#152042');
    gradient.addColorStop(1, '#0c1226');
    ctx.fillStyle = gradient;
    ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

    for (let i = 0; i < 12; i++) {
        const height = 6 + Math.random() * 10;
        const y = 18 + i * 12;
        ctx.fillStyle = `rgba(120, 230, 255, ${0.15 + Math.random() * 0.25})`;
        ctx.fillRect(14, y, canvas.width - 28, height);
    }

    ctx.fillStyle = 'rgba(255, 240, 140, 0.9)';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('HI-SCORE', 18, 34);

    ctx.fillStyle = 'rgba(255, 134, 238, 0.9)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('FORGE', 22, 72);

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.18})`;
        ctx.fillRect(12 + Math.random() * 104, 90 + Math.random() * 80, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

export class ArcadeCabinetEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'arcadeCabinet';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._marqueeMaterial = null;
        this._buttonMaterials = [];
    }

    static get displayName() { return 'Arcade Cabinet'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 0.9;
        const height = params.height || 1.8;
        const depth = params.depth || 0.78;
        const accent = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x1b1f2a,
            roughness: 0.65,
            metalness: 0.35
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x0b0d12,
            roughness: 0.8,
            metalness: 0.2
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.35,
            roughness: 0.35,
            metalness: 0.6
        });

        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const baseGeo = new THREE.BoxGeometry(width * 1.05, 0.18, depth * 1.05);
        const base = new THREE.Mesh(baseGeo, trimMat);
        base.position.y = 0.09;
        base.receiveShadow = true;
        group.add(base);

        const marqueeGeo = new THREE.BoxGeometry(width * 0.95, 0.18, depth * 0.25);
        this._marqueeMaterial = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.65
        });
        const marquee = new THREE.Mesh(marqueeGeo, this._marqueeMaterial);
        marquee.position.set(0, height - 0.08, depth / 2 - marqueeGeo.parameters.depth / 2 - 0.04);
        marquee.castShadow = true;
        group.add(marquee);

        const screenFrameGeo = new THREE.BoxGeometry(width * 0.72, height * 0.5, 0.08);
        const screenFrame = new THREE.Mesh(screenFrameGeo, trimMat);
        screenFrame.position.set(0, height * 0.62, depth / 2 - 0.06);
        screenFrame.castShadow = true;
        group.add(screenFrame);

        const screenGeo = new THREE.PlaneGeometry(width * 0.64, height * 0.42);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            map: createScreenTexture(),
            emissive: new THREE.Color(0x9ddfff),
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.15
        });
        const screen = new THREE.Mesh(screenGeo, this._screenMaterial);
        screen.position.set(0, screenFrame.position.y, screenFrame.position.z + 0.05);
        group.add(screen);

        const panelGeo = new THREE.BoxGeometry(width * 0.8, 0.18, depth * 0.6);
        const panel = new THREE.Mesh(panelGeo, bodyMat);
        panel.rotation.x = -Math.PI / 8;
        panel.position.set(0, height * 0.32, depth / 2 - 0.16);
        panel.castShadow = true;
        group.add(panel);

        const buttonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
        for (let i = 0; i < 3; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: accent,
                emissive: new THREE.Color(accent),
                emissiveIntensity: 0.4,
                roughness: 0.3,
                metalness: 0.55
            });
            this._buttonMaterials.push(mat);
            const button = new THREE.Mesh(buttonGeo, mat);
            button.rotation.x = Math.PI / 2;
            button.position.set(-0.18 + i * 0.18, panel.position.y + 0.02, panel.position.z + 0.09);
            button.castShadow = false;
            group.add(button);
        }

        const stickBaseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12);
        const stickBase = new THREE.Mesh(stickBaseGeo, trimMat);
        stickBase.rotation.x = Math.PI / 2;
        stickBase.position.set(0.2, panel.position.y + 0.02, panel.position.z + 0.02);
        stickBase.castShadow = true;
        group.add(stickBase);

        const stickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 10);
        const stick = new THREE.Mesh(stickGeo, trimMat);
        stick.position.set(stickBase.position.x, stickBase.position.y + 0.08, stickBase.position.z);
        stick.castShadow = true;
        group.add(stick);

        const knobGeo = new THREE.SphereGeometry(0.04, 12, 12);
        const knob = new THREE.Mesh(knobGeo, accentMat);
        knob.position.set(stick.position.x, stick.position.y + 0.08, stick.position.z);
        knob.castShadow = true;
        group.add(knob);

        const speakerGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12);
        const speakerMat = new THREE.MeshStandardMaterial({
            color: 0x2d3340,
            roughness: 0.9,
            metalness: 0.1
        });
        const speakerLeft = new THREE.Mesh(speakerGeo, speakerMat);
        speakerLeft.rotation.x = Math.PI / 2;
        speakerLeft.position.set(-0.18, height * 0.48, depth / 2 - 0.04);
        group.add(speakerLeft);

        const speakerRight = speakerLeft.clone();
        speakerRight.position.x = 0.18;
        group.add(speakerRight);

        const sidePanelGeo = new THREE.BoxGeometry(0.04, height * 0.9, depth * 0.92);
        const sidePanel = new THREE.Mesh(sidePanelGeo, accentMat);
        sidePanel.position.set(width / 2 + 0.02, height / 2 + 0.06, 0);
        group.add(sidePanel);

        const sidePanelLeft = sidePanel.clone();
        sidePanelLeft.position.x = -width / 2 - 0.02;
        group.add(sidePanelLeft);

        const coinSlotGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
        const coinSlot = new THREE.Mesh(coinSlotGeo, trimMat);
        coinSlot.position.set(0, height * 0.24, depth / 2 - 0.05);
        coinSlot.castShadow = true;
        group.add(coinSlot);

        this.params.width = width;
        this.params.height = height;
        this.params.depth = depth;
        this.params.accentColor = accent;

        return group;
    }

    update(dt) {
        this._time += dt;
        const screenPulse = 0.25 + Math.sin(this._time * 3.1) * 0.15;
        const marqueePulse = 0.65 + Math.sin(this._time * 4.2) * 0.25;

        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = screenPulse;
        }

        if (this._marqueeMaterial) {
            this._marqueeMaterial.emissiveIntensity = marqueePulse;
        }

        this._buttonMaterials.forEach((mat, index) => {
            mat.emissiveIntensity = 0.25 + Math.sin(this._time * 5.5 + index) * 0.15;
        });
    }
}

EntityRegistry.register('arcadeCabinet', ArcadeCabinetEntity);
