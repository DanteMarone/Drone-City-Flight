import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

function createBeamTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(120, 255, 245, 0)');
    gradient.addColorStop(0.2, 'rgba(120, 255, 245, 0.55)');
    gradient.addColorStop(0.8, 'rgba(120, 255, 245, 0.4)');
    gradient.addColorStop(1, 'rgba(120, 255, 245, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 256);

    ctx.strokeStyle = 'rgba(200, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 12; y < 256; y += 22) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(118, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(90, 180, 255, 0.25)';
    for (let i = 0; i < 18; i++) {
        const x = 20 + Math.random() * 88;
        const y = Math.random() * 240;
        ctx.fillRect(x, y, 6, 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    return texture;
}

export class FluxEmitterEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'fluxEmitter';
        this._time = 0;
        this._ringGroup = null;
        this._beamMaterial = null;
        this._coreMaterial = null;
        this._ringMaterial = null;
        this._sparkMeshes = [];
        this._virtualLight = null;
        this._lightLocalPos = null;
        this._spinSpeed = params.spinSpeed ?? (0.6 + Math.random() * 0.4);
        this._pulseSpeed = params.pulseSpeed ?? (2.4 + Math.random() * 1.2);
    }

    static get displayName() { return 'Flux Emitter'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const height = params.height ?? 3.2 + Math.random() * 0.9;
        const energyColor = new THREE.Color(params.energyColor ?? 0x7cfffb);
        const ringTilt = params.ringTilt ?? (Math.random() * 12 - 6);

        this.params.height = height;
        this.params.energyColor = energyColor.getHex();
        this.params.ringTilt = ringTilt;
        this.params.spinSpeed = this._spinSpeed;
        this.params.pulseSpeed = this._pulseSpeed;

        const baseMaterial = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete({ scale: 2 }),
            color: 0x9aa0a6,
            roughness: 0.85
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            metalness: 0.7,
            roughness: 0.35
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: energyColor,
            emissive: energyColor.clone().multiplyScalar(0.6),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.85
        });

        const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.4, 20), baseMaterial);
        pad.position.y = 0.2;
        pad.castShadow = true;
        pad.receiveShadow = true;
        group.add(pad);

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.7, 16), metalMaterial);
        pedestal.position.y = 0.75;
        pedestal.castShadow = true;
        group.add(pedestal);

        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, height, 18), metalMaterial);
        column.position.y = height / 2 + 1.1;
        column.castShadow = true;
        group.add(column);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = height + 1.1;
        ringGroup.rotation.z = THREE.MathUtils.degToRad(ringTilt);
        group.add(ringGroup);
        this._ringGroup = ringGroup;

        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 14, 48), accentMaterial.clone());
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ringGroup.add(ring);
        this._ringMaterial = ring.material;

        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 12, 36), metalMaterial.clone());
        innerRing.rotation.x = Math.PI / 2;
        innerRing.castShadow = true;
        ringGroup.add(innerRing);

        const finGeo = new THREE.BoxGeometry(0.12, 0.6, 0.3);
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(finGeo, metalMaterial);
            const angle = (i / 3) * Math.PI * 2;
            fin.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
            fin.rotation.y = angle;
            ringGroup.add(fin);
        }

        const coreMaterial = new THREE.MeshStandardMaterial({
            color: energyColor,
            emissive: energyColor,
            emissiveIntensity: 1.4,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), coreMaterial);
        core.position.y = height + 1.4;
        core.castShadow = true;
        group.add(core);
        this._coreMaterial = coreMaterial;

        const beamTexture = createBeamTexture();
        const beamMaterial = new THREE.MeshBasicMaterial({
            map: beamTexture,
            color: energyColor,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.6, 24, 1, true), beamMaterial);
        beam.position.y = height + 2.6;
        beam.renderOrder = 2;
        group.add(beam);
        this._beamMaterial = beamMaterial;

        const sparkGeo = new THREE.SphereGeometry(0.06, 10, 10);
        for (let i = 0; i < 4; i++) {
            const spark = new THREE.Mesh(sparkGeo, coreMaterial.clone());
            spark.position.y = height + 1.2 + i * 0.18;
            spark.position.x = 0.35 + Math.random() * 0.25;
            spark.position.z = (i % 2 === 0 ? 1 : -1) * (0.2 + Math.random() * 0.18);
            spark.userData.baseY = spark.position.y;
            ringGroup.add(spark);
            this._sparkMeshes.push(spark);
        }

        this._lightLocalPos = new THREE.Vector3(0, height + 1.6, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = lightSystem.register(
                worldPos,
                this.params.energyColor || 0x7cfffb,
                this.params.lightIntensity || 2.4,
                18
            );

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        if (this._ringGroup) {
            this._ringGroup.rotation.y += this._spinSpeed * dt;
            this._ringGroup.rotation.z += Math.sin(this._time * 0.7) * 0.001;
        }

        const pulse = 0.5 + 0.5 * Math.sin(this._time * this._pulseSpeed);
        if (this._beamMaterial) {
            this._beamMaterial.opacity = 0.35 + pulse * 0.35;
            if (this._beamMaterial.map) {
                this._beamMaterial.map.offset.y = (this._beamMaterial.map.offset.y + dt * 0.4) % 1;
            }
        }

        if (this._coreMaterial) {
            this._coreMaterial.emissiveIntensity = 1.1 + pulse * 0.9;
            this._coreMaterial.opacity = 0.7 + pulse * 0.25;
        }

        if (this._ringMaterial) {
            this._ringMaterial.emissiveIntensity = 0.9 + pulse * 0.8;
            this._ringMaterial.opacity = 0.6 + pulse * 0.25;
        }

        this._sparkMeshes.forEach((spark, index) => {
            const phase = this._time * 2 + index * 0.7;
            spark.position.y = (spark.userData.baseY || 0) + Math.sin(phase) * 0.05;
            spark.scale.setScalar(0.9 + Math.sin(phase) * 0.1);
        });

        if (this._virtualLight) {
            const baseIntensity = this.params.lightIntensity || 2.4;
            this._virtualLight.intensity = baseIntensity * (0.75 + pulse * 0.6);
        }
    }
}

EntityRegistry.register('fluxEmitter', FluxEmitterEntity);
