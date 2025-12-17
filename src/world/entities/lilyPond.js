import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Tranquil lily pond with animated pads and soft shoreline stones.
 */
export class LilyPondEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'lilyPond';
        this.lilyPads = [];
        this.elapsed = 0;
    }

    static get displayName() { return 'Lily Pond'; }

    createMesh(params) {
        const group = new THREE.Group();
        const radius = (params?.radius ? Number(params.radius) : null) || 1.8 + Math.random() * 1.5;

        // Ground basin
        const basinGeo = new THREE.CylinderGeometry(radius + 0.4, radius + 0.4, 0.35, 48);
        const basinMat = new THREE.MeshStandardMaterial({
            color: 0x4c4135,
            roughness: 0.95
        });
        const basin = new THREE.Mesh(basinGeo, basinMat);
        basin.position.y = 0.175;
        basin.receiveShadow = true;
        basin.castShadow = true;
        group.add(basin);

        // Water surface
        const waterGeo = new THREE.CylinderGeometry(radius, radius, 0.16, 64);
        const waterTex = this.createWaterTexture();
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x62b5e5,
            map: waterTex,
            transparent: true,
            opacity: 0.94,
            roughness: 0.25,
            metalness: 0.05
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.08;
        water.receiveShadow = true;
        group.add(water);

        this.addShoreStones(group, radius);
        this.addReeds(group, radius);
        this.addLilyPads(group, radius);

        return group;
    }

    addShoreStones(group, radius) {
        const stoneGeo = new THREE.DodecahedronGeometry(0.2);
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x8d8b85,
            roughness: 0.9
        });

        const stones = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < stones; i++) {
            const rock = new THREE.Mesh(stoneGeo, stoneMat.clone());
            rock.material.color.offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.1);
            const angle = (i / stones) * Math.PI * 2 + Math.random() * 0.3;
            const dist = radius + 0.2 + Math.random() * 0.25;
            rock.position.set(Math.cos(angle) * dist, 0.35, Math.sin(angle) * dist);
            const scale = 0.6 + Math.random() * 0.6;
            rock.scale.set(scale, 0.5 + Math.random() * 0.5, scale);
            rock.rotation.y = Math.random() * Math.PI * 2;
            rock.castShadow = true;
            rock.receiveShadow = true;
            group.add(rock);
        }
    }

    addReeds(group, radius) {
        const stalkMat = new THREE.MeshStandardMaterial({ color: 0x5b8c4a, roughness: 0.7 });
        const plumeMat = new THREE.MeshStandardMaterial({ color: 0xc9a26b, roughness: 0.6 });

        const stalkGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
        const plumeGeo = new THREE.ConeGeometry(0.08, 0.25, 8);

        const clusters = 3 + Math.floor(Math.random() * 2);
        for (let c = 0; c < clusters; c++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (radius - 0.2) + Math.random() * 0.2;
            const baseX = Math.cos(angle) * dist;
            const baseZ = Math.sin(angle) * dist;
            const stems = 3 + Math.floor(Math.random() * 3);
            for (let s = 0; s < stems; s++) {
                const offsetX = baseX + (Math.random() - 0.5) * 0.25;
                const offsetZ = baseZ + (Math.random() - 0.5) * 0.25;

                const stalk = new THREE.Mesh(stalkGeo, stalkMat);
                stalk.position.set(offsetX, 0.4, offsetZ);
                stalk.rotation.z = (Math.random() - 0.5) * 0.15;
                stalk.rotation.x = (Math.random() - 0.5) * 0.1;
                stalk.castShadow = true;
                group.add(stalk);

                const plume = new THREE.Mesh(plumeGeo, plumeMat);
                plume.position.set(offsetX, 0.9, offsetZ);
                plume.castShadow = true;
                group.add(plume);
            }
        }
    }

    addLilyPads(group, radius) {
        const padCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < padCount; i++) {
            const pad = this.createLilyPad();
            const angle = Math.random() * Math.PI * 2;
            const dist = (radius * 0.4) + Math.random() * (radius * 0.35);
            pad.group.position.set(Math.cos(angle) * dist, 0.18, Math.sin(angle) * dist);
            pad.group.rotation.y = Math.random() * Math.PI * 2;
            pad.baseY = pad.group.position.y;
            pad.baseRotation = pad.group.rotation.y;
            group.add(pad.group);
            this.lilyPads.push(pad);
        }
    }

    createLilyPad() {
        const padGroup = new THREE.Group();
        const radius = 0.4 + Math.random() * 0.25;

        const baseGeo = new THREE.CylinderGeometry(radius, radius, 0.08, 24);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2f5b2f, roughness: 0.85 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.04;
        base.receiveShadow = true;
        padGroup.add(base);

        const topGeo = new THREE.CircleGeometry(radius, 40);
        const padTex = this.createPadTexture();
        const topMat = new THREE.MeshStandardMaterial({
            map: padTex,
            transparent: true,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.rotation.x = -Math.PI / 2;
        top.position.y = 0.081;
        top.castShadow = true;
        padGroup.add(top);

        // Flower
        const flowerBaseGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const flowerBaseMat = new THREE.MeshStandardMaterial({ color: 0xf1d1d8, roughness: 0.6, metalness: 0.05 });
        const flowerCenter = new THREE.Mesh(flowerBaseGeo, flowerBaseMat);
        flowerCenter.position.set((Math.random() - 0.5) * radius * 0.3, 0.14, (Math.random() - 0.5) * radius * 0.3);
        flowerCenter.castShadow = true;
        padGroup.add(flowerCenter);

        const petalGeo = new THREE.ConeGeometry(0.05, 0.12, 6);
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xf284c3, roughness: 0.55 });
        const petals = 5 + Math.floor(Math.random() * 3);
        for (let p = 0; p < petals; p++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const ang = (p / petals) * Math.PI * 2;
            const petalDist = 0.08 + Math.random() * 0.05;
            petal.position.set(Math.cos(ang) * petalDist + flowerCenter.position.x, 0.14, Math.sin(ang) * petalDist + flowerCenter.position.z);
            petal.rotation.x = -Math.PI / 2 + 0.1;
            petal.castShadow = true;
            padGroup.add(petal);
        }

        return {
            group: padGroup,
            baseY: 0.18,
            baseRotation: padGroup.rotation.y,
            amplitude: 0.02 + Math.random() * 0.03,
            speed: 0.8 + Math.random() * 0.6,
            phase: Math.random() * Math.PI * 2
        };
    }

    createWaterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(128, 112, 40, 128, 128, 128);
        gradient.addColorStop(0, '#76d2ff');
        gradient.addColorStop(0.45, '#63b7e8');
        gradient.addColorStop(1, '#4d8db5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const r = 30 + i * 25 + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(128, 128, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    createPadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#3d7a3d';
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0.35, Math.PI * 2 + 0.35);
        ctx.fill();

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(64, 64);
        ctx.arc(64, 64, 60, -0.2, 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const veinAngle = 0.7 + i * 0.4;
            ctx.beginPath();
            ctx.moveTo(64, 64);
            ctx.lineTo(64 + Math.cos(veinAngle) * 52, 64 + Math.sin(veinAngle) * 52);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt) {
        if (!this.lilyPads.length) return;
        this.elapsed += dt;
        const time = this.elapsed;
        for (const pad of this.lilyPads) {
            pad.group.position.y = pad.baseY + Math.sin(time * pad.speed + pad.phase) * pad.amplitude;
            pad.group.rotation.y = pad.baseRotation + Math.sin(time * pad.speed * 0.5 + pad.phase) * 0.08;
        }
    }
}

EntityRegistry.register('lilyPond', LilyPondEntity);
