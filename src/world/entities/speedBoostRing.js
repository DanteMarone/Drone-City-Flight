import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createEnergyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, '#00ffc6');
    gradient.addColorStop(0.5, '#7c5bff');
    gradient.addColorStop(1, '#00ffc6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 64);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    for (let i = -40; i < 256; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 64);
        ctx.lineTo(i + 80, 0);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
}

function createArrowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00ffc6';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(48, 196);
    ctx.lineTo(128, 60);
    ctx.lineTo(208, 196);
    ctx.moveTo(128, 92);
    ctx.lineTo(128, 196);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class SpeedBoostRingEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'speedBoostRing';
        this.spinSpeed = 0.8 + Math.random() * 0.6;
        this.pulseTime = 0;
        this.ring = null;
        this.arrowPanel = null;
    }

    static get displayName() { return 'Speed Boost Ring'; }

    createMesh() {
        const group = new THREE.Group();
        const ringRadius = 2.5 + Math.random() * 0.8;
        const tubeRadius = 0.25 + Math.random() * 0.15;

        const energyTexture = createEnergyTexture();
        const energyMaterial = new THREE.MeshStandardMaterial({
            map: energyTexture,
            color: new THREE.Color(0x66ffe0),
            emissive: new THREE.Color(0x34f6ff),
            emissiveIntensity: 1.6,
            metalness: 0.45,
            roughness: 0.25
        });

        const ringGeo = new THREE.TorusGeometry(ringRadius, tubeRadius, 24, 64);
        this.ring = new THREE.Mesh(ringGeo, energyMaterial);
        this.ring.rotation.y = Math.PI / 2;
        group.add(this.ring);

        const supportMat = new THREE.MeshStandardMaterial({
            color: 0x1c1f2a,
            metalness: 0.2,
            roughness: 0.7
        });
        const capMat = new THREE.MeshStandardMaterial({
            color: 0x1f9fff,
            emissive: 0x0f4fff,
            emissiveIntensity: 0.6,
            metalness: 0.3,
            roughness: 0.4
        });

        const supportGeo = new THREE.CylinderGeometry(tubeRadius * 1.2, tubeRadius * 1.6, ringRadius * 1.4, 12);
        const capGeo = new THREE.CylinderGeometry(tubeRadius * 1.8, tubeRadius * 1.8, tubeRadius * 1.2, 16);

        const leftSupport = new THREE.Mesh(supportGeo, supportMat);
        leftSupport.position.set(-ringRadius - tubeRadius * 0.5, -ringRadius * 0.2, 0);
        const rightSupport = leftSupport.clone();
        rightSupport.position.x = ringRadius + tubeRadius * 0.5;

        const leftCap = new THREE.Mesh(capGeo, capMat);
        leftCap.position.copy(leftSupport.position);
        leftCap.position.y += supportGeo.parameters.height / 2 + (capGeo.parameters.height / 2);
        const rightCap = leftCap.clone();
        rightCap.position.x = rightSupport.position.x;

        group.add(leftSupport, rightSupport, leftCap, rightCap);

        const arrowTexture = createArrowTexture();
        const arrowMat = new THREE.MeshBasicMaterial({
            map: arrowTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const arrowGeo = new THREE.PlaneGeometry(ringRadius * 1.4, ringRadius * 1.4);
        this.arrowPanel = new THREE.Mesh(arrowGeo, arrowMat);
        this.arrowPanel.position.z = tubeRadius * 2.2;
        group.add(this.arrowPanel);

        const floorBaseGeo = new THREE.CylinderGeometry(ringRadius * 0.35, ringRadius * 0.35, tubeRadius * 1.5, 16);
        const floorBaseMat = new THREE.MeshStandardMaterial({
            color: 0x0d1018,
            metalness: 0.15,
            roughness: 0.8
        });
        const floorBase = new THREE.Mesh(floorBaseGeo, floorBaseMat);
        floorBase.position.y = -ringRadius * 0.4;
        group.add(floorBase);

        return group;
    }

    update(dt) {
        if (!this.ring) return;

        this.pulseTime += dt;
        this.ring.rotation.x += this.spinSpeed * dt;

        const pulse = 1 + Math.sin(this.pulseTime * 3) * 0.05;
        this.ring.scale.setScalar(pulse);

        if (this.arrowPanel) {
            const opacity = 0.7 + Math.sin(this.pulseTime * 2.5) * 0.25;
            this.arrowPanel.material.opacity = opacity;
        }
    }
}

EntityRegistry.register('speedBoostRing', SpeedBoostRingEntity);
