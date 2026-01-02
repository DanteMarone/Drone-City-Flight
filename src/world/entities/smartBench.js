import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [
    0x5eead4,
    0xf472b6,
    0x60a5fa,
    0xa78bfa
];

const BENCH_COLORS = [
    0x2f3237,
    0x3a2d2a,
    0x2b3b44
];

function createStatusTexture(accentColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CHARGE', 24, 48);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Seats Free', 24, 88);

    ctx.strokeStyle = `#${accentColor.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 6;
    ctx.strokeRect(170, 36, 60, 48);
    ctx.fillStyle = `#${accentColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(176, 42, 38, 36);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createSolarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1a2b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    const step = 16;
    for (let x = step; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = step; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class SmartBenchEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'smartBench';
        this._time = Math.random() * Math.PI * 2;
        this._glowMaterial = null;
        this._holoGroup = null;
        this._holoBaseY = 0;
    }

    static get displayName() { return 'Smart Bench'; }

    createMesh(params) {
        const group = new THREE.Group();

        const benchWidth = params.benchWidth || 2.6 + Math.random() * 0.4;
        const seatDepth = params.seatDepth || 0.75 + Math.random() * 0.1;
        const benchColor = params.benchColor || BENCH_COLORS[Math.floor(Math.random() * BENCH_COLORS.length)];
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        this.params.benchWidth = benchWidth;
        this.params.seatDepth = seatDepth;
        this.params.benchColor = benchColor;
        this.params.accentColor = accentColor;

        const baseMat = new THREE.MeshStandardMaterial({ color: benchColor, roughness: 0.8, metalness: 0.2 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x8c9aa7, roughness: 0.45, metalness: 0.6 });

        const baseGeo = new THREE.BoxGeometry(benchWidth, 0.2, seatDepth + 0.2);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const seatGeo = new THREE.BoxGeometry(benchWidth * 0.95, 0.16, seatDepth);
        const seat = new THREE.Mesh(seatGeo, baseMat);
        seat.position.y = 0.42;
        seat.castShadow = true;
        seat.receiveShadow = true;
        group.add(seat);

        const backGeo = new THREE.BoxGeometry(benchWidth * 0.95, 0.62, 0.12);
        const back = new THREE.Mesh(backGeo, baseMat);
        back.position.set(0, 0.86, -seatDepth * 0.42);
        back.castShadow = true;
        group.add(back);

        const sideGeo = new THREE.BoxGeometry(0.12, 0.85, seatDepth * 0.95);
        const leftSide = new THREE.Mesh(sideGeo, metalMat);
        leftSide.position.set(-benchWidth * 0.48, 0.55, 0);
        leftSide.castShadow = true;
        group.add(leftSide);

        const rightSide = leftSide.clone();
        rightSide.position.x = benchWidth * 0.48;
        group.add(rightSide);

        const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.85, 16);
        const leftArm = new THREE.Mesh(armGeo, metalMat);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.position.set(-benchWidth * 0.48, 0.92, 0.12);
        group.add(leftArm);

        const rightArm = leftArm.clone();
        rightArm.position.x = benchWidth * 0.48;
        group.add(rightArm);

        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.7,
            roughness: 0.4,
            metalness: 0.3
        });
        const ledGeo = new THREE.BoxGeometry(benchWidth * 0.82, 0.05, 0.06);
        const ledStrip = new THREE.Mesh(ledGeo, this._glowMaterial);
        ledStrip.position.set(0, 0.32, seatDepth * 0.5 + 0.02);
        group.add(ledStrip);

        const displayTexture = createStatusTexture(accentColor);
        const displayMat = new THREE.MeshBasicMaterial({ map: displayTexture, transparent: true });
        const displayGeo = new THREE.PlaneGeometry(0.8, 0.4);
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, 0.95, seatDepth * 0.45);
        group.add(display);

        const panelTexture = createSolarTexture();
        const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture, roughness: 0.4, metalness: 0.2 });
        const panelGeo = new THREE.BoxGeometry(benchWidth * 0.9, 0.08, seatDepth * 0.6);
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(0, 1.38, -seatDepth * 0.2);
        panel.rotation.x = -Math.PI / 10;
        panel.castShadow = true;
        group.add(panel);

        const holoGroup = new THREE.Group();
        const ringGeo = new THREE.TorusGeometry(0.26, 0.025, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        holoGroup.add(ring);

        const holoGeo = new THREE.CircleGeometry(0.22, 32);
        const holoMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const holoDisc = new THREE.Mesh(holoGeo, holoMat);
        holoDisc.rotation.x = Math.PI / 2;
        holoGroup.add(holoDisc);

        holoGroup.position.set(0, 1.15, seatDepth * 0.55);
        group.add(holoGroup);
        this._holoGroup = holoGroup;
        this._holoBaseY = holoGroup.position.y;

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._glowMaterial) {
            const pulse = 0.2 + Math.sin(this._time * 2.5) * 0.2;
            this._glowMaterial.emissiveIntensity = 0.6 + pulse;
        }

        if (this._holoGroup) {
            this._holoGroup.position.y = this._holoBaseY + Math.sin(this._time * 2.2) * 0.06;
            this._holoGroup.rotation.y += dt * 0.6;
        }
    }
}

EntityRegistry.register('smartBench', SmartBenchEntity);
