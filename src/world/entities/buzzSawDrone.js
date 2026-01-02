import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let warningTexture = null;

function getWarningTexture() {
    if (warningTexture) return warningTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);

    const stripeWidth = 16;
    const stripeGap = 10;
    const stripeColor = '#ff3d3d';
    const totalWidth = canvas.width * 2;

    for (let x = -totalWidth; x < totalWidth; x += stripeWidth + stripeGap) {
        ctx.fillStyle = stripeColor;
        ctx.fillRect(x, -totalWidth, stripeWidth, totalWidth * 2);
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 120; i++) {
        const size = 2 + Math.random() * 4;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }

    warningTexture = new THREE.CanvasTexture(canvas);
    warningTexture.colorSpace = THREE.SRGBColorSpace;
    warningTexture.wrapS = THREE.RepeatWrapping;
    warningTexture.wrapT = THREE.RepeatWrapping;
    warningTexture.repeat.set(1, 1);

    return warningTexture;
}

export class BuzzSawDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'buzzSawDrone';
        this._time = Math.random() * 10;
        this._ringGroup = null;
        this._bladeGroup = null;
        this._core = null;
        this._glowMaterial = null;
        this._baseY = params.y ?? 0;
        this._hoverAmplitude = params.hoverAmplitude ?? (0.22 + Math.random() * 0.12);
        this._hoverSpeed = params.hoverSpeed ?? (1.4 + Math.random() * 0.6);
        this._spinSpeed = params.spinSpeed ?? (1.6 + Math.random() * 0.8);
        this._bladeSpin = params.bladeSpin ?? (3.2 + Math.random() * 1.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.4 + Math.random() * 1.2);
    }

    static get displayName() { return 'Buzzsaw Drone'; }

    postInit() {
        if (this.mesh) {
            this._baseY = this.mesh.position.y;
        }
    }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const bodyRadius = params.bodyRadius ?? (0.7 + Math.random() * 0.2);
        const bodyHeight = params.bodyHeight ?? (0.32 + Math.random() * 0.1);
        const ringRadius = params.ringRadius ?? (1.05 + Math.random() * 0.2);
        const bladeCount = params.bladeCount ?? (8 + Math.floor(Math.random() * 4));
        const glowColor = new THREE.Color(params.glowColor ?? 0xff4545);

        this.params.bodyRadius = bodyRadius;
        this.params.bodyHeight = bodyHeight;
        this.params.ringRadius = ringRadius;
        this.params.bladeCount = bladeCount;
        this.params.glowColor = glowColor.getHex();
        this.params.hoverAmplitude = this._hoverAmplitude;
        this.params.hoverSpeed = this._hoverSpeed;
        this.params.spinSpeed = this._spinSpeed;
        this.params.bladeSpin = this._bladeSpin;
        this.params.pulseSpeed = this._pulseSpeed;

        const hullMat = new THREE.MeshStandardMaterial({
            color: 0x303540,
            metalness: 0.65,
            roughness: 0.45
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x14161b,
            metalness: 0.3,
            roughness: 0.8
        });
        const stripeMat = new THREE.MeshStandardMaterial({
            map: getWarningTexture(),
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.6
        });
        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.9
        });
        this._glowMaterial = glowMat;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.1, bodyHeight, 20), hullMat);
        body.position.y = 0.25;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.78, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2), hullMat);
        dome.position.y = body.position.y + bodyHeight * 0.5;
        dome.castShadow = true;
        group.add(dome);

        const core = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.35, 18, 16), glowMat);
        core.position.y = body.position.y + bodyHeight * 0.15;
        core.castShadow = true;
        group.add(core);
        this._core = core;

        const ringGroup = new THREE.Group();
        ringGroup.position.y = body.position.y + bodyHeight * 0.25;
        group.add(ringGroup);
        this._ringGroup = ringGroup;

        const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.08, 12, 48), stripeMat);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ringGroup.add(ring);

        const bladeGroup = new THREE.Group();
        ringGroup.add(bladeGroup);
        this._bladeGroup = bladeGroup;

        const bladeGeo = new THREE.BoxGeometry(0.14, 0.03, ringRadius * 0.85);
        for (let i = 0; i < bladeCount; i++) {
            const blade = new THREE.Mesh(bladeGeo, darkMat);
            const angle = (i / bladeCount) * Math.PI * 2;
            blade.rotation.y = angle;
            blade.position.set(Math.cos(angle) * ringRadius * 0.4, 0, Math.sin(angle) * ringRadius * 0.4);
            blade.castShadow = true;
            bladeGroup.add(blade);
        }

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10), darkMat);
        antenna.position.set(bodyRadius * 0.5, body.position.y + bodyHeight * 0.6, 0);
        group.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), glowMat.clone());
        antennaTip.position.set(bodyRadius * 0.5, body.position.y + bodyHeight * 0.82, 0);
        group.add(antennaTip);

        const thrusterGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.18, 12);
        for (let i = 0; i < 4; i++) {
            const thruster = new THREE.Mesh(thrusterGeo, darkMat);
            const angle = (i / 4) * Math.PI * 2;
            thruster.position.set(Math.cos(angle) * bodyRadius * 0.85, body.position.y - bodyHeight * 0.2, Math.sin(angle) * bodyRadius * 0.85);
            thruster.rotation.z = Math.PI / 2;
            thruster.rotation.y = angle;
            group.add(thruster);
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
        if (!this.mesh) return;

        this._time += dt;

        const hoverOffset = Math.sin(this._time * this._hoverSpeed) * this._hoverAmplitude;
        this.mesh.position.y = this._baseY + hoverOffset;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += dt * this._spinSpeed;
        }

        if (this._bladeGroup) {
            this._bladeGroup.rotation.y += dt * this._bladeSpin;
        }

        if (this._core && this._glowMaterial) {
            const pulse = 0.8 + Math.sin(this._time * this._pulseSpeed) * 0.4;
            this._glowMaterial.emissiveIntensity = pulse;
            this._core.scale.setScalar(1 + Math.sin(this._time * this._pulseSpeed) * 0.08);
        }
    }
}

EntityRegistry.register('buzzSawDrone', BuzzSawDroneEntity);
