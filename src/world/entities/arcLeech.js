import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

let coilTexture = null;

function getCoilTexture() {
    if (coilTexture) return coilTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1d24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(90, 220, 255, 0.75)';
    ctx.lineWidth = 6;
    for (let y = -64; y < canvas.height + 64; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + 24);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(20, 40, 60, 0.4)';
    for (let i = 0; i < 140; i++) {
        const size = 2 + Math.random() * 4;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }

    coilTexture = new THREE.CanvasTexture(canvas);
    coilTexture.colorSpace = THREE.SRGBColorSpace;
    coilTexture.wrapS = THREE.RepeatWrapping;
    coilTexture.wrapT = THREE.RepeatWrapping;
    coilTexture.repeat.set(1, 1);

    return coilTexture;
}

const _tempVec = new THREE.Vector3();

export class ArcLeechEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'arcLeech';
        this._time = Math.random() * 10;
        this._core = null;
        this._ringGroup = null;
        this._coilMaterial = null;
        this._coreMaterial = null;
        this._glowMaterial = null;
        this._coreBaseY = 0;
        this._drainOrigin = new THREE.Vector3();
        this._drainRadius = params.drainRadius ?? (4.5 + Math.random() * 1.5);
        this._drainRate = params.drainRate ?? (6 + Math.random() * 4);
        this._pulseSpeed = params.pulseSpeed ?? (1.8 + Math.random() * 1.4);
        this._spinSpeed = params.spinSpeed ?? (0.8 + Math.random() * 0.6);
    }

    static get displayName() { return 'Arc Leech Spire'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? (1.2 + Math.random() * 0.4);
        const columnHeight = params.columnHeight ?? (2.6 + Math.random() * 0.8);
        const energyColor = new THREE.Color(params.energyColor ?? 0x49d6ff);

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.energyColor = energyColor.getHex();
        this.params.drainRadius = this._drainRadius;
        this.params.drainRate = this._drainRate;
        this.params.pulseSpeed = this._pulseSpeed;
        this.params.spinSpeed = this._spinSpeed;

        const baseMaterial = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete({ scale: 2 }),
            color: 0x8a8f96,
            roughness: 0.9
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x3c4452,
            metalness: 0.7,
            roughness: 0.35
        });

        const coilMaterial = new THREE.MeshStandardMaterial({
            map: getCoilTexture(),
            color: 0x2c333f,
            emissive: energyColor.clone().multiplyScalar(0.3),
            emissiveIntensity: 0.6,
            metalness: 0.4,
            roughness: 0.4
        });
        this._coilMaterial = coilMaterial;

        const glowMaterial = new THREE.MeshStandardMaterial({
            color: energyColor,
            emissive: energyColor.clone().multiplyScalar(0.8),
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.85
        });
        this._glowMaterial = glowMaterial;

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.2, baseRadius * 1.4, 0.45, 20), baseMaterial);
        base.position.y = 0.22;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.85, baseRadius * 1.05, 0.32, 16), metalMaterial);
        plinth.position.y = 0.58;
        plinth.castShadow = true;
        group.add(plinth);

        const column = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.35, baseRadius * 0.5, columnHeight, 18), metalMaterial);
        column.position.y = 0.58 + columnHeight / 2;
        column.castShadow = true;
        group.add(column);

        const coil = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.6, baseRadius * 0.6, columnHeight * 0.55, 24, 1, true), coilMaterial);
        coil.position.y = 0.58 + columnHeight * 0.5;
        coil.rotation.y = Math.random() * Math.PI * 2;
        coil.castShadow = true;
        group.add(coil);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = 0.58 + columnHeight + 0.4;
        group.add(ringGroup);
        this._ringGroup = ringGroup;

        const ring = new THREE.Mesh(new THREE.TorusGeometry(baseRadius * 0.85, 0.09, 14, 48), glowMaterial.clone());
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ringGroup.add(ring);

        const finGeo = new THREE.BoxGeometry(0.12, 0.5, 0.35);
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeo, metalMaterial);
            const angle = (i / 4) * Math.PI * 2;
            fin.position.set(Math.cos(angle) * baseRadius * 0.8, 0, Math.sin(angle) * baseRadius * 0.8);
            fin.rotation.y = angle + Math.PI / 2;
            ringGroup.add(fin);
        }

        const coreMaterial = new THREE.MeshStandardMaterial({
            color: energyColor,
            emissive: energyColor,
            emissiveIntensity: 1.3,
            transparent: true,
            opacity: 0.92
        });
        this._coreMaterial = coreMaterial;

        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), coreMaterial);
        core.position.y = 0.58 + columnHeight + 0.8;
        core.castShadow = true;
        group.add(core);
        this._core = core;
        this._coreBaseY = core.position.y;
        this._drainOrigin.set(0, core.position.y, 0);

        const orbGeo = new THREE.SphereGeometry(0.08, 12, 12);
        for (let i = 0; i < 3; i++) {
            const orb = new THREE.Mesh(orbGeo, glowMaterial.clone());
            const angle = (i / 3) * Math.PI * 2;
            orb.position.set(Math.cos(angle) * 0.55, core.position.y - 0.15, Math.sin(angle) * 0.55);
            orb.userData.orbitAngle = angle;
            orb.userData.orbitRadius = 0.55 + Math.random() * 0.1;
            group.add(orb);
        }

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += this._spinSpeed * dt;
        }

        if (this._core) {
            const bob = Math.sin(this._time * this._pulseSpeed) * 0.12;
            this._core.position.y = this._coreBaseY + bob;
        }

        if (this.mesh) {
            for (const child of this.mesh.children) {
                if (child.userData && child.userData.orbitAngle !== undefined) {
                    child.userData.orbitAngle += dt * (0.9 + this._spinSpeed * 0.4);
                    const radius = child.userData.orbitRadius || 0.6;
                    child.position.x = Math.cos(child.userData.orbitAngle) * radius;
                    child.position.z = Math.sin(child.userData.orbitAngle) * radius;
                    child.position.y = this._coreBaseY - 0.2 + Math.sin(this._time * 2 + child.userData.orbitAngle) * 0.08;
                }
            }
        }

        const pulse = 0.6 + Math.sin(this._time * this._pulseSpeed) * 0.4;
        if (this._coreMaterial) {
            this._coreMaterial.emissiveIntensity = 1.1 + pulse * 1.1;
            this._coreMaterial.opacity = 0.75 + pulse * 0.2;
        }
        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 0.9 + pulse * 0.8;
        }
        if (this._coilMaterial) {
            this._coilMaterial.emissiveIntensity = 0.4 + pulse * 0.4;
        }

        const drone = window.app?.drone;
        if (!drone?.battery || !this.mesh) return;

        this.mesh.updateMatrixWorld(true);
        const drainLocal = this._core ? this._core.position : this._drainOrigin;
        _tempVec.copy(drainLocal).applyMatrix4(this.mesh.matrixWorld);
        const distance = _tempVec.distanceTo(drone.position);
        if (distance <= this._drainRadius) {
            const intensity = 1 - distance / this._drainRadius;
            const drain = this._drainRate * intensity * dt;
            drone.battery.current = Math.max(0, drone.battery.current - drain);

            if (window.app?.particles && Math.random() < 0.25) {
                window.app.particles.emit(_tempVec, 2, this.params.energyColor || 0x49d6ff);
            }
        }
    }
}

EntityRegistry.register('arcLeech', ArcLeechEntity);
