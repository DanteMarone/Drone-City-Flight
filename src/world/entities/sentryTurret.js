import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

let hazardStripeTexture = null;

function getHazardStripeTexture() {
    if (hazardStripeTexture) return hazardStripeTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);

    const stripeWidth = 18;
    const stripeGap = 10;
    const stripeColor = '#ffb320';
    const totalWidth = canvas.width * 2;

    for (let x = -totalWidth; x < totalWidth; x += stripeWidth + stripeGap) {
        ctx.fillStyle = stripeColor;
        ctx.fillRect(x, -totalWidth, stripeWidth, totalWidth * 2);
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 120; i++) {
        const size = 2 + Math.random() * 4;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }

    hazardStripeTexture = new THREE.CanvasTexture(canvas);
    hazardStripeTexture.colorSpace = THREE.SRGBColorSpace;
    hazardStripeTexture.wrapS = THREE.RepeatWrapping;
    hazardStripeTexture.wrapT = THREE.RepeatWrapping;
    hazardStripeTexture.repeat.set(1, 1);

    return hazardStripeTexture;
}

export class SentryTurretEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sentryTurret';
        this._time = Math.random() * 10;
        this._head = null;
        this._ringGroup = null;
        this._eyeMaterial = null;
        this._ringMaterial = null;
        this._scanSpeed = params.scanSpeed ?? (0.7 + Math.random() * 0.4);
        this._scanAngle = params.scanAngle ?? THREE.MathUtils.degToRad(35 + Math.random() * 20);
        this._pulseSpeed = params.pulseSpeed ?? (2 + Math.random() * 1.5);
        this._ringSpin = params.ringSpin ?? (0.4 + Math.random() * 0.5);
    }

    static get displayName() { return 'Sentry Turret'; }

    createMesh(params = {}) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius ?? (1.4 + Math.random() * 0.4);
        const columnHeight = params.columnHeight ?? (1.6 + Math.random() * 0.5);
        const headScale = params.headScale ?? (0.9 + Math.random() * 0.2);

        this.params.baseRadius = baseRadius;
        this.params.columnHeight = columnHeight;
        this.params.headScale = headScale;
        this.params.scanSpeed = this._scanSpeed;
        this.params.scanAngle = this._scanAngle;
        this.params.pulseSpeed = this._pulseSpeed;
        this.params.ringSpin = this._ringSpin;

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0x8d8f92,
            roughness: 0.9
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x3e4652,
            metalness: 0.7,
            roughness: 0.35
        });

        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x525b6b,
            metalness: 0.5,
            roughness: 0.4
        });

        const stripeMat = new THREE.MeshStandardMaterial({
            map: getHazardStripeTexture(),
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.1
        });

        const glowColor = new THREE.Color(params.glowColor ?? 0xff3b3b);
        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor.clone().multiplyScalar(0.7),
            emissiveIntensity: 1.2
        });
        this._eyeMaterial = glowMat;

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius, baseRadius * 1.2, 0.4, 20), concreteMat);
        base.position.y = 0.2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const stripeRing = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius * 0.95, 0.18, 20, 1, true), stripeMat);
        stripeRing.position.y = 0.5;
        stripeRing.castShadow = true;
        group.add(stripeRing);

        const column = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.35, baseRadius * 0.45, columnHeight, 12), metalMat);
        column.position.y = 0.5 + columnHeight / 2;
        column.castShadow = true;
        group.add(column);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = 0.6 + columnHeight;
        group.add(ringGroup);
        this._ringGroup = ringGroup;

        const ring = new THREE.Mesh(new THREE.TorusGeometry(baseRadius * 0.7, 0.08, 14, 48), glowMat.clone());
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        ringGroup.add(ring);
        this._ringMaterial = ring.material;

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.7 + columnHeight;
        group.add(headGroup);
        this._head = headGroup;

        const headGeo = new THREE.BoxGeometry(1.4 * headScale, 0.8 * headScale, 1.2 * headScale);
        const head = new THREE.Mesh(headGeo, armorMat);
        head.castShadow = true;
        head.receiveShadow = true;
        headGroup.add(head);

        const sideArmorGeo = new THREE.BoxGeometry(0.25 * headScale, 0.7 * headScale, 1.1 * headScale);
        const leftArmor = new THREE.Mesh(sideArmorGeo, metalMat);
        leftArmor.position.set(-0.85 * headScale, 0, 0);
        const rightArmor = leftArmor.clone();
        rightArmor.position.x = 0.85 * headScale;
        headGroup.add(leftArmor, rightArmor);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18 * headScale, 16, 16), glowMat);
        eye.position.set(0, 0.05 * headScale, 0.72 * headScale);
        eye.castShadow = true;
        headGroup.add(eye);

        const barrelGeo = new THREE.CylinderGeometry(0.08 * headScale, 0.1 * headScale, 0.9 * headScale, 12);
        barrelGeo.rotateX(Math.PI / 2);
        const barrelLeft = new THREE.Mesh(barrelGeo, metalMat);
        barrelLeft.position.set(-0.25 * headScale, -0.2 * headScale, 0.95 * headScale);
        const barrelRight = barrelLeft.clone();
        barrelRight.position.x = 0.25 * headScale;
        headGroup.add(barrelLeft, barrelRight);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * headScale, 0.04 * headScale, 0.5 * headScale, 8), metalMat);
        antenna.position.set(0.5 * headScale, 0.55 * headScale, -0.1 * headScale);
        headGroup.add(antenna);

        const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.09 * headScale, 10, 10), glowMat.clone());
        antennaTip.position.set(0.5 * headScale, 0.85 * headScale, -0.1 * headScale);
        headGroup.add(antennaTip);

        const panelGeo = new THREE.BoxGeometry(1.1 * headScale, 0.25 * headScale, 0.6 * headScale);
        const panel = new THREE.Mesh(panelGeo, stripeMat);
        panel.position.set(0, -0.45 * headScale, -0.15 * headScale);
        headGroup.add(panel);

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._head) {
            this._head.rotation.y = Math.sin(this._time * this._scanSpeed) * this._scanAngle;
        }

        if (this._ringGroup) {
            this._ringGroup.rotation.y += dt * this._ringSpin;
        }

        const pulse = 0.6 + Math.sin(this._time * this._pulseSpeed) * 0.4;
        if (this._eyeMaterial) {
            this._eyeMaterial.emissiveIntensity = 0.8 + pulse * 0.9;
        }
        if (this._ringMaterial) {
            this._ringMaterial.emissiveIntensity = 0.4 + pulse * 0.8;
        }
    }
}

EntityRegistry.register('sentryTurret', SentryTurretEntity);
