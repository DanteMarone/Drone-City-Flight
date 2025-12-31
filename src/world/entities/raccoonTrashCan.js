import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createRaccoonFurTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2f2f2f';
    for (let i = 0; i < 260; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 3;
        ctx.fillRect(x, y, size, size);
    }

    ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
    for (let i = 0; i < 6; i += 1) {
        const stripeWidth = 12 + Math.random() * 6;
        const offset = i * 20 + Math.random() * 4;
        ctx.fillRect(0, offset, canvas.width, stripeWidth);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createTrashCanLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1d1d1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e3e3e3';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SNACKS', canvas.width / 2, canvas.height / 2);

    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

export class RaccoonTrashCanEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'raccoonTrashCan';
        this.time = 0;
        this.headGroup = null;
        this.tailGroup = null;
        this.lidGroup = null;
        this.baseHeadY = 0;
        this.baseLidRotation = 0;
    }

    static get displayName() {
        return 'Raccoon Trash Can';
    }

    createMesh(params) {
        const group = new THREE.Group();
        const canRadius = params.canRadius ?? 0.6;
        const canHeight = params.canHeight ?? 0.95;
        const rimHeight = 0.08;

        const furTexture = createRaccoonFurTexture();
        const furColor = params.furColor || 0x5f5f5f;
        const eyeColor = params.eyeColor || 0x8cf7ff;

        const canGeo = new THREE.CylinderGeometry(canRadius, canRadius * 0.9, canHeight, 24, 1, true);
        const canMat = new THREE.MeshStandardMaterial({
            color: 0x5c5c5c,
            roughness: 0.8,
            metalness: 0.2
        });
        const canMesh = new THREE.Mesh(canGeo, canMat);
        canMesh.position.y = canHeight * 0.5;
        group.add(canMesh);

        const rimGeo = new THREE.CylinderGeometry(canRadius * 1.02, canRadius * 0.98, rimHeight, 24);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.6,
            metalness: 0.3
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.position.y = canHeight + rimHeight * 0.5;
        group.add(rimMesh);

        const labelGeo = new THREE.PlaneGeometry(canRadius * 1.2, canHeight * 0.4);
        const labelMat = new THREE.MeshStandardMaterial({
            map: createTrashCanLabelTexture(),
            transparent: true
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, canHeight * 0.55, canRadius * 0.86);
        group.add(labelMesh);

        this.lidGroup = new THREE.Group();
        const lidGeo = new THREE.CylinderGeometry(canRadius * 1.05, canRadius * 1.05, 0.08, 24);
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0x3b3b3b,
            roughness: 0.5,
            metalness: 0.4
        });
        const lidMesh = new THREE.Mesh(lidGeo, lidMat);
        lidMesh.position.y = 0.04;
        this.lidGroup.add(lidMesh);

        const handleGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16, Math.PI);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x1f1f1f,
            roughness: 0.6,
            metalness: 0.2
        });
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.rotation.x = Math.PI * 0.5;
        handleMesh.position.set(0, 0.08, canRadius * 0.62);
        this.lidGroup.add(handleMesh);

        this.lidGroup.position.y = canHeight + rimHeight * 0.6;
        this.lidGroup.rotation.x = -0.45;
        this.baseLidRotation = this.lidGroup.rotation.x;
        group.add(this.lidGroup);

        const raccoonGroup = new THREE.Group();
        raccoonGroup.position.y = canHeight * 0.72;

        const bodyGeo = new THREE.SphereGeometry(0.35, 20, 18);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: furColor,
            map: furTexture,
            roughness: 0.9
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.scale.set(1.1, 0.9, 1.1);
        bodyMesh.position.y = 0.2;
        raccoonGroup.add(bodyMesh);

        this.headGroup = new THREE.Group();
        const headGeo = new THREE.SphereGeometry(0.26, 20, 18);
        const headMat = new THREE.MeshStandardMaterial({
            color: furColor,
            map: furTexture,
            roughness: 0.85
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.scale.set(1, 0.85, 1.05);
        this.headGroup.add(headMesh);

        const maskGeo = new THREE.SphereGeometry(0.23, 20, 18);
        const maskMat = new THREE.MeshStandardMaterial({
            color: 0x2b2b2b,
            roughness: 0.9
        });
        const maskMesh = new THREE.Mesh(maskGeo, maskMat);
        maskMesh.scale.set(1.1, 0.65, 1.05);
        maskMesh.position.y = 0.02;
        this.headGroup.add(maskMesh);

        const eyeGeo = new THREE.SphereGeometry(0.04, 12, 12);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 1.2
        });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, 0.03, 0.2);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.08;
        this.headGroup.add(leftEye, rightEye);

        const noseGeo = new THREE.SphereGeometry(0.035, 12, 12);
        const noseMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8
        });
        const noseMesh = new THREE.Mesh(noseGeo, noseMat);
        noseMesh.position.set(0, -0.06, 0.22);
        this.headGroup.add(noseMesh);

        const earGeo = new THREE.ConeGeometry(0.08, 0.12, 12);
        const earMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.8
        });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.14, 0.22, 0.02);
        leftEar.rotation.x = 0.2;
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.14;
        this.headGroup.add(leftEar, rightEar);

        this.headGroup.position.y = 0.52;
        this.baseHeadY = this.headGroup.position.y;
        raccoonGroup.add(this.headGroup);

        this.tailGroup = new THREE.Group();
        const tailBaseGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.28, 12);
        const tailMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            map: furTexture,
            roughness: 0.9
        });
        const tailBaseMesh = new THREE.Mesh(tailBaseGeo, tailMat);
        tailBaseMesh.rotation.z = Math.PI * 0.5;
        tailBaseMesh.position.x = -0.2;
        this.tailGroup.add(tailBaseMesh);

        const tailTipGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.2, 12);
        const tailTipMat = new THREE.MeshStandardMaterial({
            color: 0x2b2b2b,
            roughness: 0.9
        });
        const tailTipMesh = new THREE.Mesh(tailTipGeo, tailTipMat);
        tailTipMesh.rotation.z = Math.PI * 0.5;
        tailTipMesh.position.x = -0.33;
        this.tailGroup.add(tailTipMesh);

        this.tailGroup.position.set(0.22, 0.16, -0.1);
        this.tailGroup.rotation.y = 0.6;
        raccoonGroup.add(this.tailGroup);

        const pawGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const pawMat = new THREE.MeshStandardMaterial({
            color: 0x3b3b3b,
            roughness: 0.9
        });
        const leftPaw = new THREE.Mesh(pawGeo, pawMat);
        leftPaw.position.set(-0.18, 0.12, 0.2);
        const rightPaw = leftPaw.clone();
        rightPaw.position.x = 0.18;
        raccoonGroup.add(leftPaw, rightPaw);

        group.add(raccoonGroup);
        return group;
    }

    update(dt) {
        this.time += dt;
        if (this.headGroup) {
            this.headGroup.position.y = this.baseHeadY + Math.sin(this.time * 2.2) * 0.03;
            this.headGroup.rotation.y = Math.sin(this.time * 1.4) * 0.15;
        }
        if (this.tailGroup) {
            this.tailGroup.rotation.y = 0.6 + Math.sin(this.time * 3.2) * 0.5;
        }
        if (this.lidGroup) {
            this.lidGroup.rotation.x = this.baseLidRotation + Math.sin(this.time * 1.5) * 0.12;
        }
    }
}

EntityRegistry.register('raccoonTrashCan', RaccoonTrashCanEntity);
