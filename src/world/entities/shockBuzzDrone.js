import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let warningGridTexture = null;

function getWarningGridTexture() {
    if (warningGridTexture) return warningGridTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#14171f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
    ctx.lineWidth = 6;
    for (let i = -64; i <= 128; i += 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(20, 20, 20, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 128; i += 24) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
    }

    warningGridTexture = new THREE.CanvasTexture(canvas);
    warningGridTexture.colorSpace = THREE.SRGBColorSpace;
    warningGridTexture.wrapS = THREE.RepeatWrapping;
    warningGridTexture.wrapT = THREE.RepeatWrapping;
    warningGridTexture.repeat.set(1, 1);

    return warningGridTexture;
}

const _tempVec = new THREE.Vector3();

export class ShockBuzzDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'shockBuzzDrone';
        this._time = Math.random() * 10;
        this._body = null;
        this._ring = null;
        this._rotorGroup = null;
        this._hoverGroup = null;
        this._eyeMaterial = null;
        this._ringMaterial = null;
        this._glowMaterial = null;
        this._hoverBaseY = 0;
        this._shockRadius = params.shockRadius ?? (3.8 + Math.random() * 1.2);
        this._shockRate = params.shockRate ?? (5 + Math.random() * 3);
        this._spinSpeed = params.spinSpeed ?? (1.5 + Math.random());
        this._pulseSpeed = params.pulseSpeed ?? (2.2 + Math.random() * 1.2);
        this._hoverSpeed = params.hoverSpeed ?? (1.4 + Math.random() * 0.8);
    }

    static get displayName() { return 'Shock Buzz Drone'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const bodyRadius = params.bodyRadius ?? (0.6 + Math.random() * 0.15);
        const ringRadius = params.ringRadius ?? (0.85 + Math.random() * 0.15);
        const hoverHeight = params.hoverHeight ?? (1.4 + Math.random() * 0.4);
        const glowColor = new THREE.Color(params.glowColor ?? 0xff4d4d);

        this.params.bodyRadius = bodyRadius;
        this.params.ringRadius = ringRadius;
        this.params.hoverHeight = hoverHeight;
        this.params.glowColor = glowColor.getHex();
        this.params.shockRadius = this._shockRadius;
        this.params.shockRate = this._shockRate;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;
        this.params.hoverSpeed = this._hoverSpeed;

        const shellMat = new THREE.MeshStandardMaterial({
            color: 0x3b4048,
            metalness: 0.6,
            roughness: 0.35
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x191c22,
            metalness: 0.3,
            roughness: 0.7
        });

        const ringMat = new THREE.MeshStandardMaterial({
            map: getWarningGridTexture(),
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.55
        });
        this._ringMaterial = ringMat;

        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.85
        });
        this._glowMaterial = glowMat;

        const hoverGroup = new THREE.Group();
        hoverGroup.position.y = hoverHeight;
        group.add(hoverGroup);
        this._hoverGroup = hoverGroup;

        const body = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 18, 18), shellMat);
        body.castShadow = true;
        body.receiveShadow = true;
        hoverGroup.add(body);
        this._body = body;

        const underCone = new THREE.Mesh(new THREE.ConeGeometry(bodyRadius * 0.55, bodyRadius * 0.8, 16), darkMat);
        underCone.position.y = -bodyRadius * 0.6;
        underCone.rotation.x = Math.PI;
        hoverGroup.add(underCone);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.08, 14, 36), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = bodyRadius * 0.2;
        ring.castShadow = true;
        hoverGroup.add(ring);
        this._ring = ring;

        const eye = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.18, 12, 12), glowMat);
        eye.position.set(0, bodyRadius * 0.1, bodyRadius * 0.7);
        hoverGroup.add(eye);
        this._eyeMaterial = glowMat;

        const rotorGroup = new THREE.Group();
        rotorGroup.position.y = bodyRadius * 0.65;
        hoverGroup.add(rotorGroup);
        this._rotorGroup = rotorGroup;

        const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), darkMat);
        rotorHub.position.y = 0.05;
        rotorGroup.add(rotorHub);

        const bladeGeo = new THREE.BoxGeometry(0.8, 0.04, 0.12);
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeo, shellMat);
            blade.position.y = 0.08;
            blade.rotation.y = (i / 3) * Math.PI * 2;
            rotorGroup.add(blade);
        }

        const prongGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 10);
        for (let i = 0; i < 4; i++) {
            const prong = new THREE.Mesh(prongGeo, darkMat);
            const angle = (i / 4) * Math.PI * 2;
            prong.position.set(Math.cos(angle) * bodyRadius * 0.6, -bodyRadius * 0.8, Math.sin(angle) * bodyRadius * 0.6);
            prong.rotation.x = Math.PI / 2;
            prong.rotation.z = angle;
            hoverGroup.add(prong);
        }

        const nodeGeo = new THREE.SphereGeometry(0.06, 10, 10);
        for (let i = 0; i < 3; i++) {
            const node = new THREE.Mesh(nodeGeo, glowMat.clone());
            const angle = (i / 3) * Math.PI * 2;
            node.position.set(Math.cos(angle) * ringRadius, bodyRadius * 0.2, Math.sin(angle) * ringRadius);
            node.userData.orbitAngle = angle;
            node.userData.orbitRadius = ringRadius;
            node.userData.baseY = bodyRadius * 0.2;
            hoverGroup.add(node);
        }

        this._hoverBaseY = hoverHeight;

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

        if (this._rotorGroup) {
            this._rotorGroup.rotation.y += dt * (5 + this._spinSpeed * 2);
        }

        if (this._ring) {
            this._ring.rotation.z += dt * this._spinSpeed;
        }

        if (this._hoverGroup) {
            const bob = Math.sin(this._time * this._hoverSpeed) * 0.12;
            this._hoverGroup.position.y = this._hoverBaseY + bob;
        }

        if (this._hoverGroup) {
            for (const child of this._hoverGroup.children) {
                if (child.userData && child.userData.orbitAngle !== undefined) {
                    child.userData.orbitAngle += dt * (1.4 + this._spinSpeed);
                    const radius = child.userData.orbitRadius || 0.9;
                    child.position.x = Math.cos(child.userData.orbitAngle) * radius;
                    child.position.z = Math.sin(child.userData.orbitAngle) * radius;
                    const baseY = child.userData.baseY ?? 0;
                    child.position.y = baseY + Math.sin(this._time * 2 + child.userData.orbitAngle) * 0.08;
                }
            }
        }

        const pulse = 0.6 + Math.sin(this._time * this._pulseSpeed) * 0.4;
        if (this._eyeMaterial) {
            this._eyeMaterial.emissiveIntensity = 1 + pulse * 1.1;
            this._eyeMaterial.opacity = 0.75 + pulse * 0.2;
        }
        if (this._ringMaterial) {
            this._ringMaterial.emissiveIntensity = 0.2 + pulse * 0.4;
        }
        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 0.9 + pulse * 0.9;
        }

        const drone = window.app?.drone;
        if (!drone?.battery || !this.mesh) return;

        this.mesh.updateMatrixWorld(true);
        if (this._hoverGroup) {
            this._hoverGroup.getWorldPosition(_tempVec);
        } else {
            _tempVec.set(0, this._hoverBaseY, 0).applyMatrix4(this.mesh.matrixWorld);
        }
        const distance = _tempVec.distanceTo(drone.position);
        if (distance <= this._shockRadius) {
            const intensity = 1 - distance / this._shockRadius;
            const drain = this._shockRate * intensity * dt;
            drone.battery.current = Math.max(0, drone.battery.current - drain);

            if (window.app?.particles && Math.random() < 0.25) {
                window.app.particles.emit(_tempVec, 1, this.params.glowColor || 0xff4d4d);
            }
        }
    }
}

EntityRegistry.register('shockBuzzDrone', ShockBuzzDroneEntity);
