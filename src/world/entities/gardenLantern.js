import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createLatticeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    const spacing = 28;

    for (let x = 0; x <= canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Garden lantern with a soft glow and subtle sway to add warm garden lighting.
 */
export class GardenLanternEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'gardenLantern';
        this.time = Math.random() * Math.PI * 2;
        this._virtualLight = null;
        this._baseIntensity = 2.6;
    }

    static get displayName() { return 'Garden Lantern'; }

    createMesh(params) {
        const group = new THREE.Group();

        const stakeHeight = 1.6 + Math.random() * 0.3;
        const stake = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.09, stakeHeight, 10),
            new THREE.MeshStandardMaterial({ color: 0x3d3b3a, roughness: 0.9 })
        );
        stake.position.y = stakeHeight / 2;
        stake.castShadow = true;
        stake.receiveShadow = true;
        group.add(stake);

        const brace = new THREE.Mesh(
            new THREE.TorusGeometry(0.16, 0.03, 10, 18),
            new THREE.MeshStandardMaterial({ color: 0x4c4a47, roughness: 0.7 })
        );
        brace.position.y = stakeHeight - 0.2;
        brace.rotation.x = Math.PI / 2;
        brace.castShadow = true;
        group.add(brace);

        const lanternBodyMat = new THREE.MeshStandardMaterial({
            color: 0x2d2b2b,
            roughness: 0.8,
            metalness: 0.2,
            map: createLatticeTexture()
        });
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.33, 0.36, 0.65, 16),
            lanternBodyMat
        );
        body.position.y = stakeHeight + 0.3;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const cap = new THREE.Mesh(
            new THREE.ConeGeometry(0.42, 0.3, 16),
            new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.75 })
        );
        cap.position.y = body.position.y + 0.45;
        cap.castShadow = true;
        group.add(cap);

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xfff5d6,
            emissive: 0xffd48a,
            emissiveIntensity: 1.3,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85
        });
        const glass = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 18, 16),
            glassMat
        );
        glass.position.y = body.position.y + 0.05;
        glass.castShadow = true;
        group.add(glass);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4b7a3b, roughness: 0.8 });
        for (let i = 0; i < 3; i++) {
            const leaf = new THREE.Mesh(
                new THREE.ConeGeometry(0.08, 0.25, 8),
                leafMat
            );
            const angle = (i / 3) * Math.PI * 2;
            leaf.position.set(Math.cos(angle) * 0.28, stakeHeight - 0.1, Math.sin(angle) * 0.28);
            leaf.rotation.x = Math.PI / 2;
            leaf.rotation.z = angle;
            leaf.castShadow = true;
            group.add(leaf);
        }

        this.glassMat = glassMat;
        this.lanternBody = body;

        return group;
    }

    postInit() {
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = new THREE.Vector3(0, 0.2, 0).applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || this._baseIntensity;
            this._baseIntensity = intensity;
            this._virtualLight = window.app.world.lightSystem.register(worldPos, 0xffd28f, intensity, 12);
            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this.time += dt;
        const pulse = 0.9 + Math.sin(this.time * 2.2) * 0.15;
        if (this.glassMat) {
            this.glassMat.emissiveIntensity = 1.2 * pulse;
            this.glassMat.opacity = 0.8 + (pulse - 0.9) * 0.2;
        }

        if (this.lanternBody) {
            this.lanternBody.rotation.y = Math.sin(this.time * 0.4) * 0.08;
        }

        if (this._virtualLight) {
            this._virtualLight.intensity = this._baseIntensity * pulse;
        }
    }
}

EntityRegistry.register('gardenLantern', GardenLanternEntity);
