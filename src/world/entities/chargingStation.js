import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const ACCENT_COLORS = [
    0x6dd5ed, // cyan
    0x9f7aea, // purple
    0xffa94d, // orange
    0x5eead4  // teal
];

export class ChargingStationEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'chargingStation';
        this._time = Math.random() * Math.PI * 2;
        this._glowMaterial = null;
        this._light = null;
        this._ring = null;
    }

    static get displayName() { return 'Charging Station'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 1.4 + Math.random() * 0.3;
        const columnHeight = params.columnHeight || 2.1 + Math.random() * 0.6;
        const accentColor = params.accentColor || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.accentColor = accentColor;

        const baseGeo = new THREE.CylinderGeometry(baseRadius * 1.1, baseRadius * 1.25, 0.25, 20);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.8, metalness: 0.2 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.12;
        base.receiveShadow = true;
        group.add(base);

        const padGeo = new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius, 0.08, 24);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9, metalness: 0.05 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = base.position.y + 0.16;
        pad.receiveShadow = true;
        group.add(pad);

        const columnGeo = new THREE.CylinderGeometry(0.32, 0.36, columnHeight, 18, 1, false);
        const columnMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 0.45, metalness: 0.55 });
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.castShadow = true;
        column.receiveShadow = true;
        column.position.y = columnHeight / 2 + pad.position.y + 0.04;
        group.add(column);

        const spineGeo = new THREE.BoxGeometry(0.18, columnHeight * 0.9, 0.12);
        const spineMat = new THREE.MeshStandardMaterial({ color: 0x1e252e, roughness: 0.5, metalness: 0.35 });
        const spine = new THREE.Mesh(spineGeo, spineMat);
        spine.position.set(0, column.position.y, column.geometry.parameters.radiusTop + 0.05);
        spine.castShadow = true;
        spine.receiveShadow = true;
        group.add(spine);

        const capGeo = new THREE.CylinderGeometry(0.42, 0.4, 0.25, 16);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.5, metalness: 0.4 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = column.position.y + columnHeight / 2 + 0.12;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        const haloGeo = new THREE.TorusGeometry(0.62, 0.06, 12, 36);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.7,
            roughness: 0.2,
            metalness: 0.35
        });
        this._ring = new THREE.Mesh(haloGeo, this._glowMaterial);
        this._ring.rotation.x = Math.PI / 2;
        this._ring.position.y = cap.position.y + 0.08;
        this._ring.castShadow = false;
        group.add(this._ring);

        this._light = new THREE.PointLight(accentColor, 1.2, 8, 1.8);
        this._light.position.set(0, this._ring.position.y, 0);
        group.add(this._light);

        const screen = this._createScreen(accentColor);
        screen.position.set(0, column.position.y + columnHeight * 0.15, column.geometry.parameters.radiusTop + 0.065);
        screen.castShadow = false;
        group.add(screen);

        const bumperGeo = new THREE.BoxGeometry(baseRadius * 1.6, 0.22, 0.18);
        const bumperMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.25, metalness: 0.6 });
        const bumper = new THREE.Mesh(bumperGeo, bumperMat);
        bumper.position.set(0, pad.position.y + 0.11, -baseRadius * 0.4);
        bumper.castShadow = true;
        bumper.receiveShadow = true;
        group.add(bumper);

        return group;
    }

    _createScreen(accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a0d12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f1f2f');
        gradient.addColorStop(1, '#09121c');
        ctx.fillStyle = gradient;
        ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);

        ctx.strokeStyle = '#1f2f3f';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        ctx.fillStyle = '#88ffbf';
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHARGE', canvas.width / 2, 42);

        ctx.strokeStyle = '#0d7cff';
        ctx.lineWidth = 4;
        ctx.strokeRect(28, 58, canvas.width - 56, 60);

        ctx.fillStyle = '#0d7cff';
        const levelWidth = (canvas.width - 64) * 0.75;
        ctx.fillRect(32, 62, levelWidth, 52);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Ready', canvas.width / 2, 134);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geo = new THREE.PlaneGeometry(0.62, 0.75);
        const screen = new THREE.Mesh(geo, mat);
        return screen;
    }

    update(dt) {
        this._time += dt;

        if (this._glowMaterial) {
            const pulse = 0.25 + Math.sin(this._time * 2.4) * 0.15;
            this._glowMaterial.emissiveIntensity = 0.65 + pulse;
            this._glowMaterial.needsUpdate = true;
        }

        if (this._light) {
            const flicker = 0.05 * Math.sin(this._time * 9.0);
            this._light.intensity = 1.15 + flicker;
        }

        if (this._ring) {
            this._ring.rotation.z += dt * 0.3;
        }
    }
}

EntityRegistry.register('chargingStation', ChargingStationEntity);
