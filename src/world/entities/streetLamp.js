import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * A tall urban street lamp with a subtle sway and emissive glow.
 */
export class StreetLampEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'streetLamp';
        this.time = Math.random() * Math.PI * 2;
        this.glowMaterials = [];
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.6 + Math.random() * 0.3;
    }

    static get displayName() { return 'Street Lamp'; }

    createMesh() {
        const group = new THREE.Group();
        const height = 3.8 + Math.random() * 0.6;
        const poleRadius = 0.08 + Math.random() * 0.02;
        const armLength = 0.7 + Math.random() * 0.2;
        const lampWidth = 0.32 + Math.random() * 0.06;
        const lampDepth = 0.24 + Math.random() * 0.04;

        const metalTexture = this.createMetalTexture();
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2f38,
            roughness: 0.5,
            metalness: 0.7,
            map: metalTexture
        });

        const baseGeo = new THREE.CylinderGeometry(poleRadius * 1.7, poleRadius * 1.9, 0.18, 16);
        const base = new THREE.Mesh(baseGeo, poleMaterial);
        base.position.y = 0.09;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const poleGeo = new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, height, 18);
        const pole = new THREE.Mesh(poleGeo, poleMaterial);
        pole.position.y = height / 2 + 0.18;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const collarGeo = new THREE.TorusGeometry(poleRadius * 1.15, 0.025, 8, 18);
        const collar = new THREE.Mesh(collarGeo, poleMaterial);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = pole.position.y + height * 0.18;
        collar.castShadow = true;
        group.add(collar);

        const armGeo = new THREE.BoxGeometry(armLength, poleRadius * 0.6, poleRadius * 0.6);
        const arm = new THREE.Mesh(armGeo, poleMaterial);
        arm.position.set(armLength / 2, height + 0.35, 0);
        arm.castShadow = true;
        group.add(arm);

        const lampHousingGeo = new THREE.BoxGeometry(lampWidth, lampDepth, lampDepth * 0.9);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f242b,
            roughness: 0.45,
            metalness: 0.65
        });
        const housing = new THREE.Mesh(lampHousingGeo, housingMaterial);
        housing.position.set(arm.position.x + lampWidth / 2 - 0.05, arm.position.y, 0);
        housing.castShadow = true;
        housing.receiveShadow = true;
        group.add(housing);

        const visorGeo = new THREE.BoxGeometry(lampWidth * 0.9, lampDepth * 0.2, lampDepth * 0.9);
        const visor = new THREE.Mesh(visorGeo, housingMaterial);
        visor.position.set(housing.position.x, housing.position.y - lampDepth * 0.35, 0);
        visor.castShadow = true;
        group.add(visor);

        const lensMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff3cf,
            emissive: 0xffd48a,
            emissiveIntensity: 1.4,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        this.glowMaterials.push(lensMaterial);
        const lensGeo = new THREE.CylinderGeometry(lampWidth * 0.35, lampWidth * 0.42, lampDepth * 0.45, 16);
        const lens = new THREE.Mesh(lensGeo, lensMaterial);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(housing.position.x, housing.position.y - lampDepth * 0.3, 0);
        lens.castShadow = true;
        group.add(lens);

        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x7ff5ff,
            emissive: 0x43c9ff,
            emissiveIntensity: 1.1,
            roughness: 0.3
        });
        this.glowMaterials.push(indicatorMaterial);
        const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), indicatorMaterial);
        indicator.position.set(housing.position.x - lampWidth * 0.15, housing.position.y + lampDepth * 0.28, 0.12);
        indicator.castShadow = true;
        group.add(indicator);

        const basePanelGeo = new THREE.BoxGeometry(poleRadius * 1.4, 0.22, poleRadius * 1.1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x2f3c46,
            roughness: 0.6,
            metalness: 0.4
        });
        const panel = new THREE.Mesh(basePanelGeo, panelMaterial);
        panel.position.set(0, 0.34, poleRadius * 1.2);
        panel.castShadow = true;
        group.add(panel);

        return group;
    }

    createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2a2f38';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        for (let y = 10; y < canvas.height; y += 18) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let i = 0; i < 120; i++) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                2 + Math.random() * 4,
                2 + Math.random() * 4
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 2);
        texture.anisotropy = 4;
        return texture;
    }

    update(dt) {
        this.time += dt;
        const pulse = 1.2 + Math.sin(this.time * 1.4) * 0.15;
        for (const material of this.glowMaterials) {
            material.emissiveIntensity = pulse;
        }

        if (this.mesh) {
            const sway = Math.sin(this.time * this.swaySpeed + this.swayPhase) * 0.01;
            this.mesh.rotation.z = sway;
        }
    }
}

EntityRegistry.register('streetLamp', StreetLampEntity);
