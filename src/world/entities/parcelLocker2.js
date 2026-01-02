import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [
    0x38bdf8,
    0xf97316,
    0xa855f7,
    0x22c55e,
    0xfacc15
];

const createScreenTexture = (accent) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(1, '#1f2937');
    ctx.fillStyle = gradient;
    ctx.fillRect(16, 16, canvas.width - 32, canvas.height - 32);

    ctx.strokeStyle = `#${accent.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOCK', canvas.width / 2, canvas.height / 2 - 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('PKG', canvas.width / 2, canvas.height / 2 + 28);

    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    for (let i = 0; i < 5; i += 1) {
        const x = 32 + i * 40;
        ctx.fillRect(x, canvas.height - 60, 24, 16);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const createDoorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#2f3b4b';
    ctx.lineWidth = 4;

    const cols = 2;
    const rows = 3;
    const pad = 18;
    const doorW = (canvas.width - pad * (cols + 1)) / cols;
    const doorH = (canvas.height - pad * (rows + 1)) / rows;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const x = pad + col * (doorW + pad);
            const y = pad + row * (doorH + pad);
            ctx.strokeRect(x, y, doorW, doorH);
            ctx.fillStyle = '#111827';
            ctx.fillRect(x + 6, y + 6, doorW - 12, doorH - 12);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export class ParcelLocker2Entity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'parcelLocker';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._indicatorMaterial = null;
        this._beaconRing = null;
    }

    static get displayName() { return 'Parcel Locker 2'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 2.2;
        const height = params.height || 2.1;
        const depth = params.depth || 0.75;
        const accent = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        const bodyTexture = TextureGenerator.createConcrete();
        bodyTexture.wrapS = THREE.RepeatWrapping;
        bodyTexture.wrapT = THREE.RepeatWrapping;
        bodyTexture.repeat.set(1.2, 1.6);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x222831,
            roughness: 0.6,
            metalness: 0.4,
            map: bodyTexture
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.8,
            metalness: 0.2
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, 0.16, depth * 1.05), baseMat);
        base.position.y = 0.08;
        base.receiveShadow = true;
        group.add(base);

        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
        body.position.y = height / 2 + 0.16;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.4,
            metalness: 0.6
        });
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, 0.14, depth * 0.6), canopyMat);
        canopy.position.set(0, height + 0.23, depth * 0.05);
        canopy.castShadow = true;
        group.add(canopy);

        const doorTexture = createDoorTexture();
        const doorMat = new THREE.MeshStandardMaterial({
            map: doorTexture,
            roughness: 0.55,
            metalness: 0.35
        });
        const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.92, height * 0.86), doorMat);
        doorPanel.position.set(0, body.position.y + 0.05, depth / 2 + 0.01);
        group.add(doorPanel);

        const doorHandleMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.35,
            metalness: 0.7
        });
        const handleGeo = new THREE.BoxGeometry(0.12, 0.04, 0.04);
        for (let i = 0; i < 3; i += 1) {
            const handle = new THREE.Mesh(handleGeo, doorHandleMat);
            handle.position.set(-width * 0.25 + i * 0.24, body.position.y + 0.2 - i * 0.45, depth / 2 + 0.05);
            handle.castShadow = true;
            group.add(handle);
        }

        const screenTexture = createScreenTexture(accent);
        this._screenMaterial = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.8,
            roughness: 0.25,
            metalness: 0.4
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), this._screenMaterial);
        screen.position.set(width * 0.32, body.position.y + height * 0.18, depth / 2 + 0.02);
        group.add(screen);

        const keypadMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.6,
            metalness: 0.35
        });
        const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.06), keypadMat);
        keypad.position.set(width * 0.32, body.position.y - height * 0.08, depth / 2 + 0.04);
        keypad.castShadow = true;
        group.add(keypad);

        const indicatorMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.4
        });
        this._indicatorMaterial = indicatorMat;
        const indicator = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), indicatorMat);
        indicator.rotation.x = Math.PI / 2;
        indicator.position.set(width * 0.32, body.position.y - height * 0.22, depth / 2 + 0.06);
        group.add(indicator);

        const beaconBaseMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.6
        });
        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 16), beaconBaseMat);
        beaconBase.position.set(-width * 0.35, height + 0.23, -depth * 0.1);
        group.add(beaconBase);

        const beaconMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 1.4,
            roughness: 0.15,
            metalness: 0.4,
            transparent: true,
            opacity: 0.85
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), beaconMat);
        beacon.position.set(-width * 0.35, height + 0.3, -depth * 0.1);
        group.add(beacon);

        const ringMat = new THREE.MeshStandardMaterial({
            color: accent,
            emissive: new THREE.Color(accent),
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.7
        });
        this._beaconRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 10, 32), ringMat);
        this._beaconRing.position.copy(beacon.position);
        this._beaconRing.rotation.x = Math.PI / 2;
        group.add(this._beaconRing);

        const sideVentTex = TextureGenerator.createBuildingFacade({
            color: '#1f2937',
            windowColor: '#334155',
            floors: 5,
            cols: 3,
            width: 256,
            height: 512
        });
        const ventMat = new THREE.MeshStandardMaterial({
            map: sideVentTex,
            roughness: 0.6,
            metalness: 0.3
        });
        const vent = new THREE.Mesh(new THREE.PlaneGeometry(height * 0.65, height * 0.4), ventMat);
        vent.rotation.y = Math.PI / 2;
        vent.position.set(-width / 2 - 0.01, body.position.y + 0.1, 0);
        group.add(vent);

        return group;
    }

    update(dt) {
        this._time += dt;
        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 0.6 + Math.sin(this._time * 2.2) * 0.25;
        }
        if (this._indicatorMaterial) {
            this._indicatorMaterial.emissiveIntensity = 0.9 + Math.sin(this._time * 3.4 + 1) * 0.4;
        }
        if (this._beaconRing) {
            this._beaconRing.rotation.z += dt * 1.2;
        }
    }
}

EntityRegistry.register('parcelLocker2', ParcelLocker2Entity);
