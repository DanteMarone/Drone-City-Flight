import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const POLE_COLORS = [0x1f2937, 0x111827, 0x374151, 0x0f172a];

export class StreetlightEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'streetlight';
        this._time = Math.random() * Math.PI * 2;
        this._lensMaterial = null;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
    }

    static get displayName() { return 'Streetlight'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight || 4.6 + Math.random() * 1.2;
        const poleRadius = params.poleRadius || 0.08 + Math.random() * 0.02;
        const armLength = params.armLength || 0.9 + Math.random() * 0.3;
        const baseRadius = poleRadius * 2.2;
        const baseHeight = poleRadius * 2.4;

        const poleColor = params.color || POLE_COLORS[Math.floor(Math.random() * POLE_COLORS.length)];

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: poleColor,
            roughness: 0.4,
            metalness: 0.7
        });

        const baseTexture = TextureGenerator.createConcrete();
        baseTexture.wrapS = THREE.RepeatWrapping;
        baseTexture.wrapT = THREE.RepeatWrapping;
        baseTexture.repeat.set(1.4, 1.4);

        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.85,
            metalness: 0.05,
            map: baseTexture
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 16),
            baseMaterial
        );
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius * 1.1, poleHeight, 12),
            poleMaterial
        );
        pole.position.y = baseHeight + poleHeight / 2;
        pole.castShadow = true;
        group.add(pole);

        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 0.7, poleRadius * 0.85, armLength, 10),
            poleMaterial
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0, baseHeight + poleHeight - poleRadius * 2, armLength / 2);
        arm.castShadow = true;
        group.add(arm);

        const lampHousing = new THREE.Mesh(
            new THREE.BoxGeometry(armLength * 0.35, poleRadius * 1.8, poleRadius * 2.6),
            poleMaterial
        );
        lampHousing.position.set(0, arm.position.y - poleRadius * 0.8, armLength + poleRadius * 0.6);
        lampHousing.castShadow = true;
        group.add(lampHousing);

        this._lensMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff6d2,
            emissive: new THREE.Color(0xffdf9b),
            emissiveIntensity: 1.4,
            roughness: 0.15,
            metalness: 0.05,
            transparent: true,
            opacity: 0.85
        });

        const lens = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius * 0.95, poleRadius * 0.75, poleRadius * 0.7, 12),
            this._lensMaterial
        );
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, lampHousing.position.y - poleRadius * 1.05, lampHousing.position.z + poleRadius * 0.2);
        group.add(lens);

        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(poleRadius * 1.6, poleRadius * 0.6, poleRadius * 1.6),
            poleMaterial
        );
        bracket.position.set(0, lampHousing.position.y + poleRadius * 0.4, lampHousing.position.z - poleRadius * 0.8);
        group.add(bracket);

        const signTexture = this.createStreetSignTexture(params.blockName);
        const signMaterial = new THREE.MeshStandardMaterial({
            map: signTexture,
            roughness: 0.6,
            metalness: 0.1
        });

        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.28, 0.04),
            signMaterial
        );
        sign.position.set(poleRadius * 2.6, baseHeight + poleHeight * 0.75, 0);
        sign.rotation.y = Math.PI / 2;
        group.add(sign);

        const cap = new THREE.Mesh(
            new THREE.SphereGeometry(poleRadius * 1.2, 12, 12),
            poleMaterial
        );
        cap.position.y = baseHeight + poleHeight + poleRadius * 0.9;
        cap.castShadow = true;
        group.add(cap);

        this._lightAnchor.set(
            lens.position.x,
            lens.position.y - poleRadius * 0.4,
            lens.position.z
        );

        return group;
    }

    createStreetSignTexture(label) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0b4a6f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

        const blockName = label || `BLOCK ${Math.floor(1 + Math.random() * 90)}`;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(blockName, canvas.width / 2, canvas.height / 2 + 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 2.4;
            this._lightHandle = lightSystem.register(worldPos, 0xffdf9b, intensity, 18);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;
        const flicker = 0.85 + Math.sin(this._time * 2.1) * 0.1 + Math.sin(this._time * 5.4) * 0.05;

        if (this._lensMaterial) {
            this._lensMaterial.emissiveIntensity = 1.4 * flicker;
        }

        if (this._lightHandle) {
            this._lightHandle.intensity = (this.params.lightIntensity || 2.4) * flicker;
        }
    }
}

EntityRegistry.register('streetlight', StreetlightEntity);
