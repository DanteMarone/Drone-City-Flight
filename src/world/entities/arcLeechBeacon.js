import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class ArcLeechBeaconEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'arcLeechBeacon';
        this._time = Math.random() * 10;
        this._orbGroup = null;
        this._ringMaterials = [];
        this._pulseTimer = 0;

        this._drainRadius = params.drainRadius ?? (7 + Math.random() * 2.5);
        this._drainRate = params.drainRate ?? (6 + Math.random() * 4);
        this._spinSpeed = params.spinSpeed ?? (0.6 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.2 + Math.random() * 1.1);
    }

    static get displayName() {
        return 'Arc Leech Beacon';
    }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? (1.2 + Math.random() * 0.5);
        const pillarHeight = params.pillarHeight ?? (1.8 + Math.random() * 0.6);
        const ringCount = params.ringCount ?? 3;
        const glowColor = new THREE.Color(params.glowColor ?? 0x44ffcc);

        this.params.baseRadius = baseRadius;
        this.params.pillarHeight = pillarHeight;
        this.params.ringCount = ringCount;
        this.params.glowColor = glowColor.getHex();
        this.params.drainRadius = this._drainRadius;
        this.params.drainRate = this._drainRate;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0x8b8f94,
            roughness: 0.9
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x353a44,
            metalness: 0.75,
            roughness: 0.35
        });

        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.1
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.15, 0.35, 20), concreteMat);
        base.position.y = 0.175;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.22, baseRadius * 0.3, pillarHeight, 14), metalMat);
        pillar.position.y = 0.35 + pillarHeight / 2;
        pillar.castShadow = true;
        group.add(pillar);

        const core = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.12, baseRadius * 0.12, pillarHeight * 0.7, 10), glowMat.clone());
        core.position.y = 0.45 + pillarHeight * 0.55;
        core.castShadow = true;
        group.add(core);

        for (let i = 0; i < ringCount; i++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(baseRadius * 0.65, 0.07, 10, 36), glowMat.clone());
            ring.position.y = 0.5 + (pillarHeight * 0.3) + i * 0.35;
            ring.rotation.x = Math.PI / 2;
            ring.castShadow = true;
            ring.userData.spinOffset = Math.random() * Math.PI * 2;
            this._ringMaterials.push(ring.material);
            group.add(ring);
        }

        const finGeo = new THREE.BoxGeometry(baseRadius * 0.15, 0.7, 0.12);
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeo, metalMat);
            fin.position.y = 0.5;
            fin.rotation.y = (Math.PI / 2) * i;
            fin.position.x = Math.cos(fin.rotation.y) * baseRadius * 0.8;
            fin.position.z = Math.sin(fin.rotation.y) * baseRadius * 0.8;
            fin.castShadow = true;
            group.add(fin);
        }

        const orbGroup = new THREE.Group();
        orbGroup.position.y = 0.45 + pillarHeight + 0.4;
        group.add(orbGroup);
        this._orbGroup = orbGroup;

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), glowMat.clone());
        orb.castShadow = true;
        orbGroup.add(orb);

        const shardMat = new THREE.MeshStandardMaterial({
            color: 0x8fe8ff,
            emissive: glowColor.clone().multiplyScalar(0.4),
            emissiveIntensity: 0.7,
            roughness: 0.3,
            metalness: 0.4
        });

        for (let i = 0; i < 3; i++) {
            const shard = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), shardMat);
            const angle = (Math.PI * 2 * i) / 3;
            shard.position.set(Math.cos(angle) * 0.45, 0, Math.sin(angle) * 0.45);
            shard.rotation.x = Math.PI / 2;
            shard.rotation.z = angle;
            orbGroup.add(shard);
        }

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.6 + Math.sin(this._time * this._pulseSpeed) * 0.4;

        if (this._orbGroup) {
            this._orbGroup.position.y += Math.sin(this._time * 1.7) * 0.002;
            this._orbGroup.rotation.y += dt * (this._spinSpeed * 1.5);
        }

        if (this.mesh) {
            this.mesh.children.forEach((child) => {
                if (child.geometry && child.geometry.type === 'TorusGeometry') {
                    const offset = child.userData.spinOffset || 0;
                    child.rotation.z = offset + this._time * this._spinSpeed;
                }
            });
        }

        for (const material of this._ringMaterials) {
            material.emissiveIntensity = 0.5 + pulse * 0.9;
        }

        if (!window.app || !window.app.drone || !window.app.drone.battery || !this.mesh) return;

        const drone = window.app.drone;
        const distance = this.mesh.position.distanceTo(drone.position);
        if (distance <= this._drainRadius) {
            const drain = this._drainRate * dt * (1 - distance / this._drainRadius * 0.4);
            drone.battery.current = Math.max(0, drone.battery.current - drain);

            this._pulseTimer -= dt;
            if (this._pulseTimer <= 0) {
                if (window.app.particles) {
                    window.app.particles.emit(this.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), 6, glowColorHex(this.params.glowColor));
                }
                this._pulseTimer = 0.7;
            }
        }
    }
}

function glowColorHex(color) {
    return typeof color === 'number' ? color : 0x44ffcc;
}

EntityRegistry.register('arcLeechBeacon', ArcLeechBeaconEntity);
