import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const HALO_COLORS = [
    0x7dd3fc,
    0xa7f3d0,
    0xfde68a,
    0xfbcfe8
];

export class HaloStreetLampEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'haloStreetLamp';
        this._time = Math.random() * Math.PI * 2;
        this._haloMaterial = null;
        this._coreMaterial = null;
        this._lightHandle = null;
        this._haloRing = null;
        this._lightAnchor = new THREE.Vector3();
    }

    static get displayName() { return 'Halo Street Lamp'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.poleHeight ?? (5.6 + Math.random() * 1.4);
        const armLength = params.armLength ?? (1.4 + Math.random() * 0.6);
        const poleRadius = params.poleRadius ?? 0.18;
        const baseRadius = poleRadius * 2.2;
        const haloColor = params.haloColor ?? HALO_COLORS[Math.floor(Math.random() * HALO_COLORS.length)];

        this.params.poleHeight = poleHeight;
        this.params.armLength = armLength;
        this.params.poleRadius = poleRadius;
        this.params.haloColor = haloColor;

        const poleTexture = this.createPoleTexture();
        poleTexture.wrapS = THREE.RepeatWrapping;
        poleTexture.wrapT = THREE.RepeatWrapping;
        poleTexture.repeat.set(1, 2.5);

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b5563,
            roughness: 0.45,
            metalness: 0.75,
            map: poleTexture
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.05, 0.32, 14), metalMaterial);
        base.position.y = 0.16;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius, poleRadius * 1.05, poleHeight, 16), metalMaterial);
        pole.position.y = poleHeight / 2 + base.position.y + 0.12;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const collar = new THREE.Mesh(new THREE.TorusGeometry(poleRadius * 1.35, poleRadius * 0.2, 8, 16), metalMaterial);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = pole.position.y + poleHeight * 0.22;
        collar.castShadow = true;
        group.add(collar);

        const armAnchor = new THREE.Group();
        armAnchor.position.set(0, pole.position.y + poleHeight / 2 - 0.1, 0);
        group.add(armAnchor);

        const armCurve = new THREE.Mesh(
            new THREE.TorusGeometry(armLength * 0.65, poleRadius * 0.32, 8, 20, Math.PI / 2.4),
            metalMaterial
        );
        armCurve.rotation.z = Math.PI * 0.5;
        armCurve.rotation.y = Math.PI / 2;
        armCurve.position.set(armLength * 0.38, 0, 0);
        armCurve.castShadow = true;
        armAnchor.add(armCurve);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(poleRadius * 0.45, poleRadius * 0.45, armLength, 10), metalMaterial);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(armLength / 2 + poleRadius * 0.2, -armLength * 0.12, 0);
        arm.castShadow = true;
        armAnchor.add(arm);

        const headGroup = new THREE.Group();
        headGroup.position.set(arm.position.x + armLength / 2 + poleRadius * 0.6, arm.position.y - poleRadius * 0.2, 0);
        group.add(headGroup);

        const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.24, 16), metalMaterial);
        housing.rotation.z = Math.PI / 2;
        housing.castShadow = true;
        headGroup.add(housing);

        const diffuserMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(haloColor),
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.7
        });

        const diffuser = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 18), diffuserMaterial);
        diffuser.rotation.z = Math.PI / 2;
        diffuser.position.set(0.05, 0, 0);
        headGroup.add(diffuser);

        this._coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xfef9c3,
            emissive: new THREE.Color(haloColor),
            emissiveIntensity: 1.1,
            roughness: 0.2,
            metalness: 0.1
        });

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), this._coreMaterial);
        core.position.set(0.12, 0, 0);
        headGroup.add(core);

        this._haloMaterial = new THREE.MeshStandardMaterial({
            color: haloColor,
            emissive: new THREE.Color(haloColor),
            emissiveIntensity: 0.9,
            roughness: 0.25,
            metalness: 0.1
        });

        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 24), this._haloMaterial);
        haloRing.rotation.y = Math.PI / 2;
        haloRing.rotation.z = Math.PI / 6;
        haloRing.position.set(0.1, 0, 0);
        haloRing.castShadow = true;
        headGroup.add(haloRing);
        this._haloRing = haloRing;

        const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 10), metalMaterial);
        finial.rotation.z = Math.PI / 2;
        finial.position.set(-0.18, 0.12, 0);
        headGroup.add(finial);

        const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), metalMaterial);
        sensor.position.set(-0.08, -0.12, 0.12);
        headGroup.add(sensor);

        this._lightAnchor.set(
            headGroup.position.x + 0.12,
            headGroup.position.y,
            headGroup.position.z
        );

        return group;
    }

    createPoleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#4b5563';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.lineWidth = 4;
        for (let i = 8; i < canvas.width; i += 22) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 40; i++) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                2 + Math.random() * 3,
                8 + Math.random() * 12
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const intensity = this.params.lightIntensity || 3.6;
            this._lightHandle = lightSystem.register(worldPos, this.params.haloColor || 0x7dd3fc, intensity, 22);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;
        const pulse = 0.18 + Math.sin(this._time * 2.6) * 0.12 + Math.sin(this._time * 4.3) * 0.05;
        const glow = 0.85 + pulse;

        if (this._haloMaterial) {
            this._haloMaterial.emissiveIntensity = glow;
        }
        if (this._coreMaterial) {
            this._coreMaterial.emissiveIntensity = 1.0 + pulse * 0.8;
        }
        if (this._haloRing) {
            this._haloRing.rotation.x += dt * 0.6;
        }
        if (this._lightHandle) {
            const base = this.params.lightIntensity || 3.6;
            this._lightHandle.intensity = base * (0.8 + glow * 0.35);
        }
    }
}

EntityRegistry.register('haloStreetLamp', HaloStreetLampEntity);
