import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * A glowing garden lantern with fluttering fireflies.
 */
export class GardenLanternEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'gardenLantern';
        this.time = Math.random() * Math.PI * 2;
        this.fireflies = [];
        this.lanternMaterial = null;
        this.glassMaterial = null;
    }

    static get displayName() { return 'Garden Lantern'; }

    createMesh(params) {
        const group = new THREE.Group();

        const stakeHeight = 1.1 + Math.random() * 0.4;
        const stakeGeo = new THREE.CylinderGeometry(0.05, 0.07, stakeHeight, 8);
        const stakeMat = new THREE.MeshStandardMaterial({ color: 0x3c2b1f, roughness: 0.9 });
        const stake = new THREE.Mesh(stakeGeo, stakeMat);
        stake.position.y = stakeHeight / 2;
        stake.castShadow = true;
        stake.receiveShadow = true;
        group.add(stake);

        const baseGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.08, 10);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x4b4b4b, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.04;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const lanternHeight = 0.38 + Math.random() * 0.08;
        const lanternRadius = 0.22 + Math.random() * 0.05;
        const lanternTexture = this.createPaperTexture();
        this.lanternMaterial = new THREE.MeshStandardMaterial({
            color: 0xf6e1b5,
            emissive: 0xffcf6f,
            emissiveIntensity: 1.1,
            roughness: 0.6,
            metalness: 0.05,
            map: lanternTexture
        });

        const lanternGeo = new THREE.CylinderGeometry(lanternRadius, lanternRadius * 0.95, lanternHeight, 16);
        const lantern = new THREE.Mesh(lanternGeo, this.lanternMaterial);
        lantern.position.y = stakeHeight + lanternHeight / 2 + 0.05;
        lantern.castShadow = true;
        lantern.receiveShadow = true;
        group.add(lantern);

        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffefc6,
            emissive: 0xffd98c,
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6
        });

        const glassGeo = new THREE.CylinderGeometry(lanternRadius * 0.6, lanternRadius * 0.6, lanternHeight * 0.7, 12);
        const glass = new THREE.Mesh(glassGeo, this.glassMaterial);
        glass.position.y = lantern.position.y;
        group.add(glass);

        const capGeo = new THREE.ConeGeometry(lanternRadius * 1.05, lanternHeight * 0.3, 12);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.7 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = lantern.position.y + lanternHeight / 2 + lanternHeight * 0.15;
        cap.castShadow = true;
        group.add(cap);

        const ringGeo = new THREE.TorusGeometry(lanternRadius * 0.5, 0.02, 6, 16);
        const ring = new THREE.Mesh(ringGeo, capMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = cap.position.y + 0.07;
        ring.castShadow = true;
        group.add(ring);

        const fireflyCount = 3 + Math.floor(Math.random() * 3);
        const fireflyMat = new THREE.MeshStandardMaterial({
            color: 0xfff2b3,
            emissive: 0xfff2b3,
            emissiveIntensity: 1.8,
            roughness: 0.4
        });

        for (let i = 0; i < fireflyCount; i++) {
            const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), fireflyMat);
            const orbitRadius = lanternRadius * (1.1 + Math.random() * 0.6);
            const orbitHeight = lantern.position.y + (Math.random() - 0.2) * 0.2;
            const speed = 0.8 + Math.random() * 0.9;
            const phase = Math.random() * Math.PI * 2;

            firefly.position.set(
                Math.cos(phase) * orbitRadius,
                orbitHeight,
                Math.sin(phase) * orbitRadius
            );
            firefly.castShadow = true;
            group.add(firefly);

            this.fireflies.push({
                mesh: firefly,
                orbitRadius,
                orbitHeight,
                speed,
                phase,
                bobOffset: Math.random() * Math.PI * 2
            });
        }

        return group;
    }

    createPaperTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f5e6c8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(120, 90, 60, 0.25)';
        ctx.lineWidth = 6;
        for (let x = 8; x < canvas.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(168, 124, 72, 0.2)';
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            const radius = 6 + Math.random() * 10;
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                radius,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.anisotropy = 4;
        return texture;
    }

    update(dt) {
        this.time += dt;
        const glow = 1 + Math.sin(this.time * 2.2) * 0.15;
        if (this.lanternMaterial) {
            this.lanternMaterial.emissiveIntensity = 1.0 * glow;
        }
        if (this.glassMaterial) {
            this.glassMaterial.emissiveIntensity = 0.8 * glow;
        }

        for (const firefly of this.fireflies) {
            const angle = this.time * firefly.speed + firefly.phase;
            const bob = Math.sin(this.time * 3 + firefly.bobOffset) * 0.06;
            firefly.mesh.position.x = Math.cos(angle) * firefly.orbitRadius;
            firefly.mesh.position.z = Math.sin(angle) * firefly.orbitRadius;
            firefly.mesh.position.y = firefly.orbitHeight + bob;
        }
    }
}

EntityRegistry.register('gardenLantern', GardenLanternEntity);
