import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let razorPlateTexture = null;

function getRazorPlateTexture() {
    if (razorPlateTexture) return razorPlateTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1f232b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#3b414b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#515865';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 64, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = '#e5b635';
    for (let i = -96; i < 96; i += 24) {
        ctx.fillRect(i, -6, 12, 12);
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 90; i += 1) {
        const size = 2 + Math.random() * 3;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }

    razorPlateTexture = new THREE.CanvasTexture(canvas);
    razorPlateTexture.colorSpace = THREE.SRGBColorSpace;
    razorPlateTexture.wrapS = THREE.RepeatWrapping;
    razorPlateTexture.wrapT = THREE.RepeatWrapping;

    return razorPlateTexture;
}

export class RazorDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'razorDrone';
        this._time = Math.random() * 10;
        this._bladeGroup = null;
        this._glowMaterials = [];
        this._hoverSpeed = params.hoverSpeed ?? (1.2 + Math.random() * 0.6);
        this._hoverAmplitude = params.hoverAmplitude ?? (0.12 + Math.random() * 0.08);
        this._bladeSpin = params.bladeSpin ?? (2.8 + Math.random() * 1.2);
        this._pulseSpeed = params.pulseSpeed ?? (3 + Math.random() * 2);
        this._baseY = params.y ?? 0;
    }

    static get displayName() { return 'Razor Drone'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const bodyRadius = params.bodyRadius ?? (0.55 + Math.random() * 0.12);
        const bodyHeight = params.bodyHeight ?? (0.6 + Math.random() * 0.1);
        const ringRadius = params.ringRadius ?? bodyRadius * 1.65;
        const ringTube = params.ringTube ?? bodyRadius * 0.18;
        const hoverHeight = params.hoverHeight ?? (0.95 + Math.random() * 0.2);
        const glowColor = new THREE.Color(params.glowColor ?? 0xff3838);

        this.params.bodyRadius = bodyRadius;
        this.params.bodyHeight = bodyHeight;
        this.params.ringRadius = ringRadius;
        this.params.ringTube = ringTube;
        this.params.hoverHeight = hoverHeight;
        this.params.glowColor = `#${glowColor.getHexString()}`;
        this.params.hoverSpeed = this._hoverSpeed;
        this.params.hoverAmplitude = this._hoverAmplitude;
        this.params.bladeSpin = this._bladeSpin;
        this.params.pulseSpeed = this._pulseSpeed;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x343a45,
            metalness: 0.55,
            roughness: 0.35
        });

        const plateMat = new THREE.MeshStandardMaterial({
            map: getRazorPlateTexture(),
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.8
        });

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xa1a7b0,
            metalness: 0.85,
            roughness: 0.25
        });

        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.1
        });
        this._glowMaterials.push(glowMat);

        const body = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 18, 18), bodyMat);
        body.position.y = hoverHeight;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const band = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 1.1, bodyRadius * 1.1, bodyHeight, 18, 1, true), plateMat);
        band.position.y = hoverHeight;
        band.castShadow = true;
        group.add(band);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.22, 12, 12), glowMat);
        eye.position.set(0, hoverHeight + bodyRadius * 0.05, bodyRadius * 0.75);
        eye.castShadow = true;
        group.add(eye);

        const core = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.18, 12, 12), glowMat.clone());
        core.position.set(0, hoverHeight - bodyRadius * 0.15, 0);
        this._glowMaterials.push(core.material);
        group.add(core);

        const bladeGroup = new THREE.Group();
        bladeGroup.position.y = hoverHeight;
        this._bladeGroup = bladeGroup;
        group.add(bladeGroup);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, ringTube, 10, 48), bladeMat);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        bladeGroup.add(ring);

        const bladeGeo = new THREE.BoxGeometry(ringRadius * 0.55, ringTube * 0.45, ringTube * 0.18);
        const bladeCount = 8;
        for (let i = 0; i < bladeCount; i += 1) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            const angle = (Math.PI * 2 * i) / bladeCount;
            blade.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * 0.02, Math.sin(angle) * ringRadius);
            blade.rotation.y = angle;
            blade.castShadow = true;
            bladeGroup.add(blade);
        }

        const thrusterGeo = new THREE.CylinderGeometry(bodyRadius * 0.14, bodyRadius * 0.18, bodyRadius * 0.55, 12);
        for (let i = 0; i < 4; i += 1) {
            const thruster = new THREE.Mesh(thrusterGeo, bodyMat);
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            thruster.position.set(Math.cos(angle) * bodyRadius * 0.95, hoverHeight - bodyRadius * 0.1, Math.sin(angle) * bodyRadius * 0.95);
            thruster.rotation.z = Math.PI / 2;
            thruster.rotation.y = angle;
            thruster.castShadow = true;
            group.add(thruster);

            const nozzle = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.12, 10, 10), glowMat.clone());
            nozzle.position.set(
                Math.cos(angle) * bodyRadius * 1.1,
                hoverHeight - bodyRadius * 0.1,
                Math.sin(angle) * bodyRadius * 1.1
            );
            nozzle.castShadow = true;
            this._glowMaterials.push(nozzle.material);
            group.add(nozzle);
        }

        const spikeGeo = new THREE.ConeGeometry(bodyRadius * 0.14, bodyRadius * 0.55, 8);
        for (let i = 0; i < 3; i += 1) {
            const spike = new THREE.Mesh(spikeGeo, bladeMat);
            const angle = (Math.PI * 2 * i) / 3;
            spike.position.set(Math.cos(angle) * bodyRadius * 0.4, hoverHeight - bodyRadius * 0.9, Math.sin(angle) * bodyRadius * 0.4);
            spike.rotation.x = Math.PI;
            spike.castShadow = true;
            group.add(spike);
        }

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.05, bodyRadius * 0.05, bodyRadius * 0.7, 8), bodyMat);
        antenna.position.set(bodyRadius * 0.2, hoverHeight + bodyRadius * 0.9, -bodyRadius * 0.1);
        antenna.castShadow = true;
        group.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.1, 10, 10), glowMat.clone());
        antennaTip.position.set(bodyRadius * 0.2, hoverHeight + bodyRadius * 1.25, -bodyRadius * 0.1);
        antennaTip.castShadow = true;
        this._glowMaterials.push(antennaTip.material);
        group.add(antennaTip);

        group.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
            }
        });

        return group;
    }

    update(dt) {
        if (!this.mesh) return;
        this._time += dt;

        const hoverOffset = Math.sin(this._time * this._hoverSpeed) * this._hoverAmplitude;
        this.mesh.position.y = this._baseY + hoverOffset;

        if (this._bladeGroup) {
            this._bladeGroup.rotation.y += dt * this._bladeSpin;
            this._bladeGroup.rotation.x = Math.sin(this._time * 0.8) * 0.12;
        }

        const pulse = 0.7 + Math.sin(this._time * this._pulseSpeed) * 0.35;
        this._glowMaterials.forEach((material) => {
            material.emissiveIntensity = 1.1 * pulse;
        });

        if (window.app?.colliderSystem && this.box) {
            this.box.setFromObject(this.mesh);
            window.app.colliderSystem.updateBody(this.mesh);
        }
    }
}

EntityRegistry.register('razorDrone', RazorDroneEntity);
