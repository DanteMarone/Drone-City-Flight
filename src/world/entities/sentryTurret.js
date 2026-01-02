import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class SentryTurretEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sentryTurret';
        this._time = 0;
        this._headGroup = null;
        this._eyeMaterial = null;
        this._glowMaterials = [];
        this._baseRotation = this.rotation.clone();
        this._scanSpeed = params.scanSpeed ?? (0.6 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.2 + Math.random());
    }

    static get displayName() { return 'Sentry Turret'; }

    createMesh(params) {
        const group = new THREE.Group();

        const height = params.height ?? (1.35 + Math.random() * 0.2);
        const baseRadius = params.baseRadius ?? (0.7 + Math.random() * 0.1);
        this.params.height = height;
        this.params.baseRadius = baseRadius;
        this.params.scanSpeed = this._scanSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const concreteTex = TextureGenerator.createConcrete();
        const warningTex = this.createWarningTexture();

        const baseMat = new THREE.MeshStandardMaterial({
            map: warningTex,
            color: 0xf6c453,
            roughness: 0.7,
            metalness: 0.2
        });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, 0.3, 24), baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const plinthMat = new THREE.MeshStandardMaterial({
            map: concreteTex,
            color: 0x3a3f45,
            roughness: 0.9,
            metalness: 0.1
        });
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(baseRadius * 1.3, 0.2, baseRadius * 1.3), plinthMat);
        plinth.position.y = 0.35;
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        group.add(plinth);

        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x565c63,
            roughness: 0.4,
            metalness: 0.6
        });
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, height, 18), columnMat);
        column.position.y = height / 2 + 0.45;
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);

        const headGroup = new THREE.Group();
        headGroup.position.y = height + 0.55;
        this._headGroup = headGroup;
        group.add(headGroup);

        const casingMat = new THREE.MeshStandardMaterial({
            color: 0x2a2f35,
            roughness: 0.35,
            metalness: 0.8
        });

        const headCore = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), casingMat);
        headCore.castShadow = true;
        headCore.receiveShadow = true;
        headGroup.add(headCore);

        const domeMat = new THREE.MeshStandardMaterial({
            color: 0x3f4a54,
            roughness: 0.25,
            metalness: 0.9
        });
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
        dome.position.y = 0.08;
        dome.castShadow = true;
        dome.receiveShadow = true;
        headGroup.add(dome);

        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3b3b,
            emissive: new THREE.Color(0xff1a1a),
            emissiveIntensity: 1.4,
            roughness: 0.2,
            metalness: 0.1
        });
        this._eyeMaterial = eyeMaterial;
        this._glowMaterials.push(eyeMaterial);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeMaterial);
        eye.position.set(0, 0.02, 0.28);
        headGroup.add(eye);

        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x1b1f24,
            roughness: 0.4,
            metalness: 0.7
        });
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 14), barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.02, 0.45);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        headGroup.add(barrel);

        const muzzleMat = new THREE.MeshStandardMaterial({
            color: 0x9ca3af,
            roughness: 0.3,
            metalness: 0.9
        });
        const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 10, 20), muzzleMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, -0.02, 0.65);
        headGroup.add(muzzle);

        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xff4d4d,
            emissive: new THREE.Color(0xff2d2d),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
            roughness: 0.2,
            metalness: 0.3
        });
        this._glowMaterials.push(ringMat);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 10, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.05;
        headGroup.add(ring);

        const antennaMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.4,
            metalness: 0.6
        });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.25, 10), antennaMat);
        antenna.position.set(-0.18, 0.3, -0.08);
        antenna.rotation.z = -0.2;
        headGroup.add(antenna);

        const emitterMat = new THREE.MeshStandardMaterial({
            color: 0xff7676,
            emissive: new THREE.Color(0xff4d4d),
            emissiveIntensity: 1.0
        });
        this._glowMaterials.push(emitterMat);

        const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), emitterMat);
        emitter.position.set(-0.2, 0.42, -0.1);
        headGroup.add(emitter);

        return group;
    }

    createWarningTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f5c542';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#1f1f1f';
        ctx.lineWidth = 18;
        for (let i = -canvas.height; i < canvas.width * 2; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, -10);
            ctx.lineTo(i - canvas.height, canvas.height + 10);
            ctx.stroke();
        }

        for (let i = 0; i < 180; i += 1) {
            const shade = 40 + Math.random() * 40;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.08)`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 1);
        return texture;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;
        const pulse = 0.8 + 0.25 * Math.sin(this._time * this._pulseSpeed);

        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x,
                this._baseRotation.y,
                this._baseRotation.z
            );
        }

        if (this._headGroup) {
            this._headGroup.rotation.y = Math.sin(this._time * this._scanSpeed) * 0.7;
            this._headGroup.rotation.x = Math.sin(this._time * 0.9) * 0.12;
        }

        if (this._glowMaterials.length) {
            this._glowMaterials.forEach((material, index) => {
                if (material.emissiveIntensity !== undefined) {
                    material.emissiveIntensity = THREE.MathUtils.clamp(pulse + index * 0.08, 0.5, 1.6);
                }
                if (material.opacity !== undefined) {
                    material.opacity = THREE.MathUtils.clamp(0.5 + pulse * 0.25, 0.4, 0.8);
                }
            });
        }

        if (this._eyeMaterial) {
            this._eyeMaterial.color.setHSL(0.0, 0.9, 0.5 + 0.15 * Math.sin(this._time * 4));
        }
    }
}

EntityRegistry.register('sentryTurret', SentryTurretEntity);
