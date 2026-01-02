import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const ACCENT_COLORS = [
    0x0f172a,
    0x1f2937,
    0x334155,
    0x1e293b
];

export class HaloLampEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'haloLamp';
        this._time = Math.random() * Math.PI * 2;
        this._ringMaterial = null;
        this._coreMaterial = null;
        this._ringMesh = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._accentColor = params.color || ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        this._lightColor = params.lightColor || 0x7dd3fc;
    }

    static get displayName() { return 'Halo Lamp'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 0.42;
        const baseHeight = params.baseHeight || 0.14;
        const poleHeight = params.poleHeight || 2.4;
        const poleRadius = params.poleRadius || 0.07;
        const ringRadius = params.ringRadius || 0.5;
        const ringTube = params.ringTube || 0.05;

        const concreteTexture = TextureGenerator.createConcrete();
        concreteTexture.wrapS = THREE.RepeatWrapping;
        concreteTexture.wrapT = THREE.RepeatWrapping;
        concreteTexture.repeat.set(1.4, 1.4);

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            map: concreteTexture,
            roughness: 0.9,
            metalness: 0.05
        });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.15, baseHeight, 18), baseMaterial);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: this._accentColor,
            roughness: 0.35,
            metalness: 0.7
        });

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, poleHeight, 12), metalMaterial);
        pole.position.y = baseHeight + poleHeight / 2;
        pole.castShadow = true;
        group.add(pole);

        const collar = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 1.4, poleRadius * 1.4, baseHeight * 0.6, 12),
            metalMaterial
        );
        collar.position.y = baseHeight + poleHeight * 0.25;
        collar.castShadow = true;
        group.add(collar);

        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 1.4, poleRadius * 1.9, poleRadius * 1.2, 12),
            metalMaterial
        );
        head.position.y = baseHeight + poleHeight + poleRadius * 0.6;
        head.castShadow = true;
        group.add(head);

        const canopy = new THREE.Mesh(
            new THREE.ConeGeometry(ringRadius * 0.65, ringTube * 1.4, 10),
            metalMaterial
        );
        canopy.position.y = head.position.y + ringTube * 0.9;
        canopy.castShadow = true;
        group.add(canopy);

        this._ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xdbeafe,
            emissive: new THREE.Color(this._lightColor),
            emissiveIntensity: 1.4,
            roughness: 0.2,
            metalness: 0.15
        });
        this._ringMesh = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, ringTube, 12, 32), this._ringMaterial);
        this._ringMesh.rotation.x = Math.PI / 2;
        this._ringMesh.position.y = head.position.y + ringTube * 0.4;
        this._ringMesh.castShadow = true;
        group.add(this._ringMesh);

        this._coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            emissive: new THREE.Color(this._lightColor),
            emissiveIntensity: 1.8,
            roughness: 0.1,
            metalness: 0.1
        });
        const core = new THREE.Mesh(new THREE.SphereGeometry(ringTube * 0.9, 12, 12), this._coreMaterial);
        core.position.copy(this._ringMesh.position);
        group.add(core);

        const panelTexture = this.createControlPanelTexture();
        const panelMaterial = new THREE.MeshStandardMaterial({
            map: panelTexture,
            roughness: 0.4,
            metalness: 0.2
        });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(poleRadius * 3.2, poleRadius * 2.4, poleRadius * 1.2), panelMaterial);
        panel.position.set(0, baseHeight + poleHeight * 0.55, poleRadius * 1.5);
        panel.castShadow = true;
        group.add(panel);

        this._lightAnchor.set(0, this._ringMesh.position.y, 0);

        return group;
    }

    createControlPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#1f2937';
        ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

        const stripGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        stripGradient.addColorStop(0, '#38bdf8');
        stripGradient.addColorStop(0.5, '#a5f3fc');
        stripGradient.addColorStop(1, '#38bdf8');
        ctx.fillStyle = stripGradient;
        ctx.fillRect(18, canvas.height * 0.45, canvas.width - 36, canvas.height * 0.16);

        for (let i = 0; i < 24; i += 1) {
            const alpha = Math.random() * 0.15;
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
            const intensity = this.params.lightIntensity || 2.6;
            this._lightHandle = lightSystem.register(worldPos, this._lightColor, intensity, 18);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;
        const pulse = 0.75 + Math.sin(this._time * 2.4) * 0.2 + Math.sin(this._time * 4.8) * 0.1;

        if (this._ringMesh) {
            this._ringMesh.rotation.z += dt * 0.6;
        }

        if (this._ringMaterial) {
            this._ringMaterial.emissiveIntensity = 1.2 * pulse;
        }

        if (this._coreMaterial) {
            this._coreMaterial.emissiveIntensity = 1.6 * pulse;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = (this.params.lightIntensity || 2.6) * pulse;
        }
    }
}

EntityRegistry.register('haloLamp', HaloLampEntity);
