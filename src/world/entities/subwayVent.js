import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SubwayVentEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'subwayVent';
        this._time = 0;
        this._steamPuffs = [];
        this._fanGroup = null;
        this._glowMaterial = null;
        this._steamSpeed = params.steamSpeed ?? (0.7 + Math.random() * 0.5);
        this._steamRise = params.steamRise ?? (0.5 + Math.random() * 0.4);
        this._pulseOffset = params.pulseOffset ?? Math.random() * Math.PI * 2;
        this._steamBaseY = 0.55;
    }

    static get displayName() { return 'Subway Vent'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width ?? 1.6;
        const depth = params.depth ?? 1.2;
        const height = params.height ?? 0.25;
        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;
        this.params.steamSpeed = this._steamSpeed;
        this.params.steamRise = this._steamRise;
        this.params.pulseOffset = this._pulseOffset;

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x3c3f45,
            roughness: 0.85,
            metalness: 0.2
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), baseMat);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x1f2329,
            roughness: 0.7,
            metalness: 0.5
        });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.08, depth * 0.9), frameMat);
        frame.position.y = height + 0.04;
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        const grateMat = new THREE.MeshStandardMaterial({
            color: 0x111318,
            roughness: 0.6,
            metalness: 0.7
        });
        const barGeo = new THREE.BoxGeometry(width * 0.85, 0.035, 0.05);
        const barCount = 6;
        for (let i = 0; i < barCount; i += 1) {
            const bar = new THREE.Mesh(barGeo, grateMat);
            const z = ((i - (barCount - 1) / 2) / barCount) * depth * 0.7;
            bar.position.set(0, height + 0.09, z);
            bar.castShadow = true;
            bar.receiveShadow = true;
            group.add(bar);
        }

        const fanGroup = new THREE.Group();
        fanGroup.position.y = height + 0.08;
        this._fanGroup = fanGroup;
        group.add(fanGroup);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 12), grateMat);
        hub.rotation.x = Math.PI / 2;
        hub.castShadow = true;
        hub.receiveShadow = true;
        fanGroup.add(hub);

        const bladeGeo = new THREE.BoxGeometry(0.4, 0.03, 0.08);
        for (let i = 0; i < 4; i += 1) {
            const blade = new THREE.Mesh(bladeGeo, grateMat);
            blade.rotation.y = (Math.PI / 2) * i;
            blade.position.z = 0.18;
            blade.castShadow = true;
            blade.receiveShadow = true;
            fanGroup.add(blade);
        }

        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x60646d,
            roughness: 0.5,
            metalness: 0.4
        });
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12), pipeMat);
        pipe.position.set(width * 0.45, 0.45, depth * 0.15);
        pipe.rotation.z = Math.PI / 2;
        pipe.castShadow = true;
        pipe.receiveShadow = true;
        group.add(pipe);

        const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 12, 24, Math.PI / 2), pipeMat);
        elbow.position.set(width * 0.45, 0.45, depth * 0.45);
        elbow.rotation.x = Math.PI / 2;
        elbow.rotation.y = Math.PI / 2;
        elbow.castShadow = true;
        elbow.receiveShadow = true;
        group.add(elbow);

        const glowMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            emissive: new THREE.Color(0xffa347),
            emissiveIntensity: 0.8,
            roughness: 0.4,
            metalness: 0.2
        });
        this._glowMaterial = glowMat;
        const glowRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20, 1, true), glowMat);
        glowRing.position.y = height + 0.05;
        glowRing.rotation.x = Math.PI / 2;
        group.add(glowRing);

        const steamGroup = new THREE.Group();
        steamGroup.position.y = this._steamBaseY;
        group.add(steamGroup);

        const puffGeo = new THREE.SphereGeometry(0.12, 12, 12);
        for (let i = 0; i < 3; i += 1) {
            const puffMat = new THREE.MeshStandardMaterial({
                color: 0xe8f4ff,
                emissive: new THREE.Color(0xbad6ff),
                emissiveIntensity: 0.35,
                transparent: true,
                opacity: 0.6
            });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            puff.position.y = i * 0.1;
            puff.castShadow = false;
            puff.receiveShadow = false;
            steamGroup.add(puff);
            this._steamPuffs.push({
                mesh: puff,
                material: puffMat,
                phase: Math.random()
            });
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        if (this._fanGroup) {
            this._fanGroup.rotation.y += dt * 3.2;
        }

        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 0.6 + 0.3 * Math.sin(this._time * 3 + this._pulseOffset);
        }

        const rise = this._steamRise;
        for (const puff of this._steamPuffs) {
            const t = (this._time * this._steamSpeed + puff.phase) % 1;
            puff.mesh.position.y = this._steamBaseY + t * rise;
            const scale = 0.35 + t * 0.8;
            puff.mesh.scale.setScalar(scale);
            puff.material.opacity = 0.6 * (1 - t);
        }
    }
}

EntityRegistry.register('subwayVent', SubwayVentEntity);
