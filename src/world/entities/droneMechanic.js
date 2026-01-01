import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec = new THREE.Vector3();
const _tempTarget = new THREE.Vector3();

export class DroneMechanicEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'droneMechanic';
        this._time = Math.random() * Math.PI * 2;
        this._waveArm = null;
        this._orbiter = null;
        this._glowMaterial = null;
        this._chargeTimer = 0;
        this._glowLight = null;
    }

    static get displayName() {
        return 'Drone Mechanic';
    }

    createMesh(params) {
        const group = new THREE.Group();

        const suitColor = params.suitColor ?? 0x2f6da8;
        const shirtColor = params.shirtColor ?? 0xf6c453;
        const skinColor = params.skinColor ?? 0xf1c27d;
        const accentColor = params.accentColor ?? 0x39d98a;
        const chargeRange = params.chargeRange ?? 6.5;
        const chargeRate = params.chargeRate ?? 12;
        const orbRadius = params.orbRadius ?? 0.85;

        this.params.suitColor = suitColor;
        this.params.shirtColor = shirtColor;
        this.params.skinColor = skinColor;
        this.params.accentColor = accentColor;
        this.params.chargeRange = chargeRange;
        this.params.chargeRate = chargeRate;
        this.params.orbRadius = orbRadius;

        const pantsGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.9, 12);
        const pantsMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.85 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.45;
        group.add(pants);

        const torsoGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.65, 12);
        const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.2;
        group.add(torso);

        const beltGeo = new THREE.TorusGeometry(0.28, 0.05, 8, 16);
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.rotation.x = Math.PI / 2;
        belt.position.y = 0.95;
        group.add(belt);

        const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: skinColor });
        headMat.map = this._createFaceTexture(skinColor, accentColor);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.78;
        head.rotation.y = -Math.PI / 2;
        group.add(head);

        const visorGeo = new THREE.BoxGeometry(0.55, 0.08, 0.2);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.6 });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.87, 0.15);
        group.add(visor);

        const backpackGeo = new THREE.BoxGeometry(0.4, 0.6, 0.25);
        const backpackMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.6 });
        const backpack = new THREE.Mesh(backpackGeo, backpackMat);
        backpack.position.set(0, 1.15, -0.28);
        group.add(backpack);

        const cellGeo = new THREE.BoxGeometry(0.22, 0.42, 0.08);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.9,
            roughness: 0.2,
            metalness: 0.2
        });
        const cell = new THREE.Mesh(cellGeo, this._glowMaterial);
        cell.position.set(0, 1.15, -0.15);
        group.add(cell);

        const armGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
        const armLeft = new THREE.Mesh(armGeo, torsoMat);
        armLeft.position.set(0.33, 1.35, 0.1);
        armLeft.rotation.x = -0.3;
        armLeft.rotation.z = -0.1;
        group.add(armLeft);

        const tabletGeo = new THREE.BoxGeometry(0.22, 0.3, 0.05);
        const tabletMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.4 });
        const tablet = new THREE.Mesh(tabletGeo, tabletMat);
        tablet.position.set(0.33, 1.1, 0.28);
        tablet.rotation.x = -0.4;
        group.add(tablet);

        const armRight = new THREE.Mesh(armGeo, torsoMat);
        armRight.position.set(-0.33, 1.45, 0.05);
        armRight.rotation.x = -0.7;
        armRight.rotation.z = 0.4;
        armRight.userData.baseRotation = armRight.rotation.clone();
        this._waveArm = armRight;
        group.add(armRight);

        const toolGroup = new THREE.Group();
        const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const orbMat = new THREE.MeshStandardMaterial({
            color: 0x77f5d2,
            emissive: new THREE.Color(0x22ffbb),
            emissiveIntensity: 1.1,
            roughness: 0.2
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        toolGroup.add(orb);

        const ringGeo = new THREE.TorusGeometry(0.18, 0.03, 10, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x6ee7ff,
            emissive: new THREE.Color(0x49d9ff),
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.4
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        toolGroup.add(ring);
        toolGroup.position.set(orbRadius, 1.6, 0);
        this._orbiter = toolGroup;
        group.add(toolGroup);

        this._glowLight = new THREE.PointLight(accentColor, 0.8, 4, 2);
        this._glowLight.position.set(0, 1.4, -0.1);
        group.add(this._glowLight);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(skinHex, accentHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const base = new THREE.Color(skinHex);
        const accent = new THREE.Color(accentHex);

        ctx.fillStyle = `#${base.getHexString()}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(46, 56, 6, 0, Math.PI * 2);
        ctx.arc(82, 56, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 78, 18, 0, Math.PI);
        ctx.stroke();

        ctx.strokeStyle = `#${accent.getHexString()}`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 42, 28, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        ctx.fillStyle = `#${accent.getHexString()}`;
        ctx.fillRect(92, 48, 10, 8);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        this._time += dt;

        if (this._waveArm) {
            const base = this._waveArm.userData.baseRotation;
            this._waveArm.rotation.x = base.x + Math.sin(this._time * 3.2) * 0.2;
            this._waveArm.rotation.z = base.z + Math.sin(this._time * 2.4) * 0.2;
        }

        if (this._orbiter) {
            const radius = this.params.orbRadius ?? 0.85;
            const angle = this._time * 1.6;
            this._orbiter.position.x = Math.cos(angle) * radius;
            this._orbiter.position.z = Math.sin(angle) * radius;
            this._orbiter.position.y = 1.55 + Math.sin(this._time * 2.2) * 0.08;
            this._orbiter.rotation.y += dt * 2.4;
        }

        if (this._glowMaterial) {
            const pulse = 0.3 + Math.sin(this._time * 4.2) * 0.2;
            this._glowMaterial.emissiveIntensity = 0.7 + pulse;
        }

        if (this._glowLight) {
            this._glowLight.intensity = 0.6 + Math.sin(this._time * 3.8) * 0.2;
        }

        if (!window.app || !window.app.drone || !window.app.drone.battery) return;

        const drone = window.app.drone;
        const range = this.params.chargeRange ?? 6.5;
        const rate = this.params.chargeRate ?? 12;
        const dist = this.mesh.position.distanceTo(drone.position);

        if (dist <= range) {
            drone.battery.add(rate * dt);
            this._chargeTimer += dt;

            if (this._chargeTimer >= 0.25 && window.app.particles) {
                this._chargeTimer = 0;
                _tempVec.copy(drone.position);
                _tempVec.y += 0.4;
                _tempVec.x += (Math.random() - 0.5) * 0.6;
                _tempVec.z += (Math.random() - 0.5) * 0.6;
                window.app.particles.emit(_tempVec, 4, this.params.accentColor ?? 0x39d98a);
            }
        } else {
            this._chargeTimer = 0;
        }

        if (dist < range * 1.4) {
            _tempTarget.set(drone.position.x, this.mesh.position.y, drone.position.z);
            this.mesh.lookAt(_tempTarget);
        }
    }
}

EntityRegistry.register('droneMechanic', DroneMechanicEntity);
