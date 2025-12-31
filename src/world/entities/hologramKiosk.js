import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class HologramKioskEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'hologramKiosk';
        this._time = 0;
        this._holoGroup = null;
        this._holoMaterials = [];
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Hologram Kiosk'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 1.9;
        this.params.height = height;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x8e8e8e,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.1
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 18), baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.4,
            metalness: 0.6
        });
        const column = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, 0.35), columnMat);
        column.position.y = height / 2 + 0.2;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.2
        });
        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.12, 16), canopyMat);
        canopy.position.y = height + 0.3;
        canopy.castShadow = true;
        group.add(canopy);

        const screenTexture = TextureGenerator.createBuildingFacade({
            color: '#07131a',
            windowColor: '#59f2ff',
            floors: 8,
            cols: 3,
            width: 256,
            height: 256
        });
        screenTexture.repeat.set(1, 2);

        const screenMat = new THREE.MeshStandardMaterial({
            map: screenTexture,
            emissive: new THREE.Color(0x49f1ff),
            emissiveIntensity: 0.7,
            roughness: 0.4,
            metalness: 0.2
        });

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.65), screenMat);
        screen.position.set(0, height * 0.65 + 0.2, 0.19);
        screen.castShadow = false;
        group.add(screen);

        const sidePanelMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.5,
            metalness: 0.3
        });
        const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.32), sidePanelMat);
        sidePanel.position.set(0.28, height * 0.6 + 0.2, 0.02);
        group.add(sidePanel);

        const holoGroup = new THREE.Group();
        holoGroup.position.y = height + 0.46;
        group.add(holoGroup);
        this._holoGroup = holoGroup;

        const holoTexture = this.createHologramTexture();
        const holoMat = new THREE.MeshStandardMaterial({
            map: holoTexture,
            color: 0x7df9ff,
            transparent: true,
            opacity: 0.7,
            emissive: new THREE.Color(0x7df9ff),
            emissiveIntensity: 1.1,
            depthWrite: false
        });
        this._holoMaterials.push(holoMat);

        const holoDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24, 1, true), holoMat);
        holoDisc.rotation.x = Math.PI / 2;
        holoGroup.add(holoDisc);

        const holoCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 16, 1, true), holoMat);
        holoCone.position.y = 0.3;
        holoCone.rotation.y = Math.PI / 6;
        holoGroup.add(holoCone);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 10, 32), holoMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.22;
        holoGroup.add(halo);

        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: new THREE.Color(0x38bdf8),
            emissiveIntensity: 1.2
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), beaconMat);
        beacon.position.set(0, height + 0.34, 0);
        group.add(beacon);
        this._holoMaterials.push(beaconMat);

        return group;
    }

    createHologramTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        gradient.addColorStop(0, 'rgba(96, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(96, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(96, 255, 255, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(180, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
            ctx.beginPath();
            ctx.arc(128, 128, 18 + i * 12, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(200, 255, 255, 0.15)';
        for (let i = 0; i < 30; i += 1) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                4 + Math.random() * 8,
                1 + Math.random() * 2
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const sway = Math.sin(this._time * 0.6 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.2);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y + sway,
                this._baseRotation.z
            );
        }

        if (this._holoGroup) {
            this._holoGroup.rotation.y += dt * 0.9;
            this._holoGroup.position.y = (this.params.height || 1.9) + 0.46 + Math.sin(this._time * 1.6) * 0.03;
        }

        if (this._holoMaterials.length) {
            const pulse = 0.4 + 0.2 * Math.sin(this._time * 3.4) + 0.1 * Math.sin(this._time * 8.5);
            this._holoMaterials.forEach((material) => {
                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = THREE.MathUtils.clamp(0.8 + pulse, 0.6, 1.5);
                }
            });
        }
    }
}

EntityRegistry.register('hologramKiosk', HologramKioskEntity);
