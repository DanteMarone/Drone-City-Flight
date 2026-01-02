import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec = new THREE.Vector3();

export class ArcPulseTotemEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'arcPulseTotem';
        this._time = Math.random() * Math.PI * 2;
        this._coilRings = [];
        this._glowMaterials = [];
        this._orb = null;
        this._pulseRing = null;
        this._zapTimer = 0;
        this._pulseSpeed = params.pulseSpeed ?? (2.4 + Math.random());
        this._spinSpeed = params.spinSpeed ?? (0.9 + Math.random() * 0.6);
    }

    static get displayName() {
        return 'Arc Pulse Totem';
    }

    createCoilTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#101820';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < canvas.height; y += 10) {
            ctx.fillStyle = y % 20 === 0 ? '#2dd4bf' : '#0f766e';
            ctx.fillRect(0, y, canvas.width, 6);
        }

        for (let i = 0; i < 60; i += 1) {
            const size = 2 + Math.random() * 4;
            ctx.fillStyle = `rgba(45, 212, 191, ${0.15 + Math.random() * 0.2})`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 2.5);
        return texture;
    }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? 0.8 + Math.random() * 0.2;
        const baseHeight = 0.18;
        const columnHeight = params.columnHeight ?? 1.1 + Math.random() * 0.4;
        const drainRange = params.drainRange ?? 8;
        const drainRate = params.drainRate ?? 7;
        const zapInterval = params.zapInterval ?? 0.6;

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.drainRange = drainRange;
        this.params.drainRate = drainRate;
        this.params.zapInterval = zapInterval;
        this.params.pulseSpeed = this._pulseSpeed;
        this.params.spinSpeed = this._spinSpeed;
        this._baseHeight = baseHeight;

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.85,
            metalness: 0.3
        });
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 1.2, baseRadius * 1.3, baseHeight, 20),
            baseMat
        );
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plateMat = new THREE.MeshStandardMaterial({
            color: 0x374151,
            roughness: 0.7,
            metalness: 0.45
        });
        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius * 1.05, 0.12, 20),
            plateMat
        );
        plate.position.y = baseHeight + 0.06;
        plate.castShadow = true;
        group.add(plate);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.45,
            metalness: 0.8
        });
        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.35, baseRadius * 0.45, columnHeight, 16),
            columnMat
        );
        column.position.y = baseHeight + 0.12 + columnHeight / 2;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const coilMat = new THREE.MeshStandardMaterial({
            map: this.createCoilTexture(),
            roughness: 0.55,
            metalness: 0.4
        });
        const coil = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.38, baseRadius * 0.38, 0.55, 22, 1, true),
            coilMat
        );
        coil.position.y = baseHeight + 0.12 + columnHeight * 0.55;
        coil.castShadow = true;
        group.add(coil);

        const glowColor = new THREE.Color(0x2dd4bf);
        const ringMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.3
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(baseRadius * 0.55, 0.05, 12, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = baseHeight + 0.12 + columnHeight * 0.75;
        group.add(ring);
        this._coilRings.push(ring);
        this._glowMaterials.push(ringMat);

        const topMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.4,
            metalness: 0.7
        });
        const topCap = new THREE.Mesh(
            new THREE.CylinderGeometry(baseRadius * 0.42, baseRadius * 0.32, 0.18, 16),
            topMat
        );
        topCap.position.y = baseHeight + 0.12 + columnHeight + 0.06;
        topCap.castShadow = true;
        group.add(topCap);

        const orbMat = new THREE.MeshStandardMaterial({
            color: 0x5eead4,
            emissive: new THREE.Color(0x2dd4bf),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.1
        });
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), orbMat);
        orb.position.y = baseHeight + 0.12 + columnHeight + 0.38;
        orb.castShadow = true;
        group.add(orb);
        this._orb = orb;
        this._glowMaterials.push(orbMat);

        const pulseMat = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            emissive: new THREE.Color(0x14b8a6),
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const pulseRing = new THREE.Mesh(new THREE.TorusGeometry(baseRadius * 1.1, 0.025, 8, 40), pulseMat);
        pulseRing.rotation.x = Math.PI / 2;
        pulseRing.position.y = baseHeight + 0.02;
        group.add(pulseRing);
        this._pulseRing = pulseRing;
        this._glowMaterials.push(pulseMat);

        const prongMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.5,
            metalness: 0.6
        });
        for (let i = 0; i < 4; i += 1) {
            const angle = (Math.PI * 2 * i) / 4;
            const prong = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 8), prongMat);
            prong.position.set(Math.cos(angle) * baseRadius * 0.38, baseHeight + 0.12 + columnHeight + 0.22, Math.sin(angle) * baseRadius * 0.38);
            prong.rotation.x = Math.PI;
            prong.rotation.z = angle;
            prong.castShadow = true;
            group.add(prong);
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const pulse = 0.7 + Math.sin(this._time * this._pulseSpeed) * 0.35;
        this._glowMaterials.forEach((material, index) => {
            material.emissiveIntensity = pulse + index * 0.05;
        });

        this._coilRings.forEach((ring, index) => {
            ring.rotation.z += dt * (this._spinSpeed + index * 0.2);
        });

        if (this._orb) {
            const columnHeight = this.params.columnHeight ?? 1.1;
            const baseHeight = this._baseHeight ?? 0.18;
            this._orb.position.y = baseHeight + 0.12 + columnHeight + 0.38 + Math.sin(this._time * 2.6) * 0.08;
        }

        if (this._pulseRing) {
            const scale = 1 + Math.sin(this._time * 3.4) * 0.05;
            this._pulseRing.scale.set(scale, scale, scale);
        }

        if (!window.app || !window.app.drone || !window.app.drone.battery) return;

        const drone = window.app.drone;
        const range = Number(this.params.drainRange) || 8;
        const rate = Number(this.params.drainRate) || 7;
        const dist = this.mesh.position.distanceTo(drone.position);

        if (dist <= range) {
            drone.battery.current = Math.max(0, drone.battery.current - rate * dt);
            this._zapTimer -= dt;

            if (this._zapTimer <= 0 && window.app.particles) {
                _tempVec.copy(this.mesh.position);
                _tempVec.y += (this.params.columnHeight ?? 1.1) + 0.55;
                window.app.particles.emit(_tempVec, 6, 0x2dd4bf);
                window.app.particles.emit(drone.position, 4, 0x5eead4);
                this._zapTimer = Number(this.params.zapInterval) || 0.6;
            }
        } else {
            this._zapTimer = 0;
        }
    }
}

EntityRegistry.register('arcPulseTotem', ArcPulseTotemEntity);
