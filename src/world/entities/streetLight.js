import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * A tall streetlight with a glowing lamp and subtle flicker.
 */
export class StreetLightEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'streetLight';
        this.time = Math.random() * Math.PI * 2;
        this.glowMaterial = null;
        this.panelMaterial = null;
    }

    static get displayName() { return 'Street Light'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height || 4.2 + Math.random() * 0.6;
        const armLength = params.armLength || 1.1 + Math.random() * 0.3;
        const baseRadius = 0.22 + Math.random() * 0.05;
        const poleRadius = baseRadius * 0.35;

        this.params.height = height;
        this.params.armLength = armLength;

        const baseGeo = new THREE.CylinderGeometry(baseRadius * 1.1, baseRadius, 0.28, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2e2e32, roughness: 0.7, metalness: 0.4 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.14;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const poleGeo = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, height, 12);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.6, metalness: 0.5 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = height / 2 + 0.2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const capGeo = new THREE.CylinderGeometry(poleRadius * 1.1, poleRadius * 0.7, 0.2, 10);
        const cap = new THREE.Mesh(capGeo, poleMat);
        cap.position.y = pole.position.y + height / 2 + 0.1;
        cap.castShadow = true;
        group.add(cap);

        const armGeo = new THREE.BoxGeometry(armLength, poleRadius * 1.4, poleRadius * 1.4);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(armLength / 2, cap.position.y - 0.08, 0);
        arm.castShadow = true;
        group.add(arm);

        const housingGeo = new THREE.BoxGeometry(0.45, 0.18, 0.28);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x414854, roughness: 0.5, metalness: 0.45 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(arm.position.x + armLength / 2 - 0.18, arm.position.y - 0.1, 0);
        housing.castShadow = true;
        group.add(housing);

        const panelTexture = this.createPanelTexture();
        this.panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe6b0,
            emissive: 0xffd27d,
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.1,
            map: panelTexture
        });

        const panelGeo = new THREE.BoxGeometry(0.35, 0.04, 0.22);
        const panel = new THREE.Mesh(panelGeo, this.panelMaterial);
        panel.position.set(housing.position.x, housing.position.y - 0.11, housing.position.z);
        panel.castShadow = false;
        group.add(panel);

        this.glowMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff2c2,
            emissive: 0xffe0a3,
            emissiveIntensity: 1.5,
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        });

        const bulbGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const bulb = new THREE.Mesh(bulbGeo, this.glowMaterial);
        bulb.position.set(housing.position.x, housing.position.y - 0.18, housing.position.z);
        group.add(bulb);

        const controlGeo = new THREE.BoxGeometry(0.22, 0.28, 0.16);
        const controlMat = new THREE.MeshStandardMaterial({ color: 0x30343c, roughness: 0.7, metalness: 0.3 });
        const controlBox = new THREE.Mesh(controlGeo, controlMat);
        controlBox.position.set(-poleRadius * 1.2, height * 0.35, poleRadius * 0.6);
        controlBox.castShadow = true;
        group.add(controlBox);

        const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.set(controlBox.position.x + 0.03, controlBox.position.y - 0.28, controlBox.position.z - 0.02);
        cable.rotation.z = Math.PI / 2.8;
        group.add(cable);

        return group;
    }

    createPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f7d99c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(120, 90, 50, 0.35)';
        ctx.lineWidth = 6;
        for (let y = 12; y < canvas.height; y += 28) {
            ctx.beginPath();
            ctx.moveTo(8, y);
            ctx.lineTo(canvas.width - 8, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(140, 100, 60, 0.5)';
        ctx.lineWidth = 2;
        for (let x = 18; x < canvas.width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, 8);
            ctx.lineTo(x, canvas.height - 8);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = 4;
        return texture;
    }

    update(dt) {
        this.time += dt;
        const pulse = 1 + Math.sin(this.time * 2.6) * 0.12;
        const flicker = 0.92 + Math.sin(this.time * 10.5) * 0.04;
        if (this.glowMaterial) {
            this.glowMaterial.emissiveIntensity = 1.4 * pulse * flicker;
        }
        if (this.panelMaterial) {
            this.panelMaterial.emissiveIntensity = 1.1 * pulse * flicker;
        }
    }
}

EntityRegistry.register('streetLight', StreetLightEntity);
