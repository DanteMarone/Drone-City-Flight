import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const PANEL_COLORS = [
    '#0ea5e9',
    '#22c55e',
    '#f97316',
    '#a855f7'
];

export class BikeRepairStandEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'bikeRepairStand';
        this._time = Math.random() * Math.PI * 2;
        this._screenMaterial = null;
        this._armLeft = null;
        this._armRight = null;
        this._hose = null;
        this._lightAnchor = new THREE.Vector3();
        this._lightHandle = null;
    }

    static get displayName() { return 'Bike Repair Stand'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseWidth = params.baseWidth || 0.9;
        const baseDepth = params.baseDepth || 0.6;
        const baseHeight = params.baseHeight || 0.1;

        const baseTexture = TextureGenerator.createSidewalkBlank(128, 128);
        baseTexture.repeat.set(1, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,
            map: baseTexture,
            roughness: 0.9,
            metalness: 0.05
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth), baseMaterial);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        group.add(base);

        const postHeight = params.postHeight || 1.6;
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.4,
            metalness: 0.7
        });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, postHeight, 12), postMaterial);
        post.position.y = baseHeight + postHeight / 2;
        post.castShadow = true;
        group.add(post);

        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 12), postMaterial);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.y = post.position.y + postHeight / 2 - 0.2;
        crossbar.castShadow = true;
        group.add(crossbar);

        const clampMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.3,
            metalness: 0.6
        });
        const armGeo = new THREE.BoxGeometry(0.16, 0.05, 0.1);
        this._armLeft = new THREE.Mesh(armGeo, clampMaterial);
        this._armLeft.position.set(-0.22, crossbar.position.y, 0.12);
        this._armLeft.castShadow = true;
        group.add(this._armLeft);

        this._armRight = this._armLeft.clone();
        this._armRight.position.x = 0.22;
        group.add(this._armRight);

        const boardDepth = 0.08;
        const boardMaterial = new THREE.MeshStandardMaterial({
            map: this.createToolPanelTexture(),
            roughness: 0.45,
            metalness: 0.2
        });
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, boardDepth), boardMaterial);
        board.position.set(0.25, baseHeight + 0.85, -0.18);
        board.castShadow = true;
        board.receiveShadow = true;
        group.add(board);

        const accentColor = params.accentColor || PANEL_COLORS[Math.floor(Math.random() * PANEL_COLORS.length)];
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.3
        });
        this._screenMaterial = screenMaterial;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), screenMaterial);
        screen.position.set(0.25, baseHeight + 0.93, -0.18 + boardDepth / 2 + 0.002);
        group.add(screen);

        const pumpMaterial = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.5,
            metalness: 0.4
        });
        const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12), pumpMaterial);
        pump.position.set(-0.25, baseHeight + 0.25, 0.22);
        pump.castShadow = true;
        group.add(pump);

        const pumpHandle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), pumpMaterial);
        pumpHandle.position.set(-0.25, baseHeight + 0.52, 0.22);
        pumpHandle.castShadow = true;
        group.add(pumpHandle);

        const hoseMaterial = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.1
        });
        this._hose = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 10, 24, Math.PI * 1.2), hoseMaterial);
        this._hose.rotation.x = Math.PI / 2;
        this._hose.position.set(-0.36, baseHeight + 0.2, 0.16);
        group.add(this._hose);

        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 10), pumpMaterial);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(-0.36, baseHeight + 0.2, 0.04);
        nozzle.castShadow = true;
        group.add(nozzle);

        this._lightAnchor.set(0.25, baseHeight + 0.93, -0.12);

        return group;
    }

    createToolPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#374151';
        ctx.fillRect(8, 8, canvas.width - 16, canvas.height - 16);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(24, 40);
        ctx.lineTo(52, 22);
        ctx.lineTo(80, 40);
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.fillRect(28, 64, 22, 12);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(58, 64, 42, 12);

        for (let i = 0; i < 18; i += 1) {
            const alpha = 0.08 + Math.random() * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, 0x7dd3fc, 1.0, 10);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.9 + Math.sin(this._time * 3.2) * 0.2;

        if (this._screenMaterial) {
            this._screenMaterial.emissiveIntensity = 1.0 * pulse;
        }

        const swing = Math.sin(this._time * 1.6) * 0.12;
        if (this._armLeft) {
            this._armLeft.rotation.z = swing;
        }
        if (this._armRight) {
            this._armRight.rotation.z = -swing;
        }
        if (this._hose) {
            this._hose.rotation.y = Math.sin(this._time * 1.2) * 0.2;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = 1.0 * pulse;
        }
    }
}

EntityRegistry.register('bikeRepairStand', BikeRepairStandEntity);
