import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const createTrashTexture = (baseColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor.getStyle();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 6; i += 1) {
        const x = 12 + i * 20 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.random() * 8 - 4, canvas.height);
        ctx.stroke();
    }

    for (let i = 0; i < 600; i += 1) {
        const v = Math.floor(20 + Math.random() * 30);
        ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.2})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
};

class RaccoonTrashCanEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'raccoonTrashCan';
        this._time = 0;
        this._tailPivot = null;
        this._lidPivot = null;
        this._eyeMeshes = [];
    }

    static get displayName() { return 'Raccoon Trash Can'; }

    createMesh(params) {
        const group = new THREE.Group();
        const bodyHeight = 1.05 + Math.random() * 0.2;
        const bodyRadius = 0.45 + Math.random() * 0.05;

        const baseColor = new THREE.Color().setHSL(0.56, 0.08, 0.36 + Math.random() * 0.08);
        const bodyMat = new THREE.MeshStandardMaterial({
            map: createTrashTexture(baseColor),
            color: baseColor,
            roughness: 0.75,
            metalness: 0.35
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x5f6b73,
            roughness: 0.6,
            metalness: 0.35
        });
        const lidMat = new THREE.MeshStandardMaterial({
            color: 0x3e474f,
            roughness: 0.55,
            metalness: 0.4
        });

        const canGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.05, bodyHeight, 18);
        const can = new THREE.Mesh(canGeo, bodyMat);
        can.position.y = bodyHeight / 2;
        can.castShadow = true;
        can.receiveShadow = true;
        group.add(can);

        const rimGeo = new THREE.TorusGeometry(bodyRadius * 0.98, 0.04, 10, 24);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = bodyHeight + 0.03;
        rim.castShadow = true;
        group.add(rim);

        const lidPivot = new THREE.Group();
        lidPivot.position.y = bodyHeight + 0.04;
        lidPivot.position.z = -bodyRadius * 0.2;
        group.add(lidPivot);
        this._lidPivot = lidPivot;

        const lidGeo = new THREE.CylinderGeometry(bodyRadius * 1.02, bodyRadius * 1.08, 0.08, 18);
        const lid = new THREE.Mesh(lidGeo, lidMat);
        lid.position.set(0, 0.04, bodyRadius * 0.2);
        lid.castShadow = true;
        lid.receiveShadow = true;
        lidPivot.add(lid);

        const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10);
        const handleLeft = new THREE.Mesh(handleGeo, rimMat);
        handleLeft.rotation.z = Math.PI / 2;
        handleLeft.position.set(-bodyRadius - 0.05, bodyHeight * 0.65, 0);
        group.add(handleLeft);
        const handleRight = handleLeft.clone();
        handleRight.position.x = bodyRadius + 0.05;
        group.add(handleRight);

        const furMat = new THREE.MeshStandardMaterial({
            color: 0x5b5f63,
            roughness: 0.9,
            metalness: 0.05
        });
        const maskMat = new THREE.MeshStandardMaterial({
            color: 0x2a2d2f,
            roughness: 0.85,
            metalness: 0.05
        });
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xb1b4b8,
            roughness: 0.85,
            metalness: 0.02
        });

        const bodyGeo = new THREE.SphereGeometry(0.32, 16, 12);
        const raccoonBody = new THREE.Mesh(bodyGeo, furMat);
        raccoonBody.scale.set(1.1, 0.9, 1);
        raccoonBody.position.set(0, bodyHeight + 0.24, 0.05);
        raccoonBody.castShadow = true;
        group.add(raccoonBody);

        const headGeo = new THREE.SphereGeometry(0.22, 16, 12);
        const head = new THREE.Mesh(headGeo, furMat);
        head.position.set(0, bodyHeight + 0.52, 0.15);
        head.castShadow = true;
        group.add(head);

        const maskGeo = new THREE.BoxGeometry(0.32, 0.14, 0.1);
        const mask = new THREE.Mesh(maskGeo, maskMat);
        mask.position.set(0, bodyHeight + 0.52, 0.3);
        group.add(mask);

        const earGeo = new THREE.ConeGeometry(0.06, 0.12, 10);
        const leftEar = new THREE.Mesh(earGeo, maskMat);
        leftEar.position.set(-0.12, bodyHeight + 0.7, 0.08);
        leftEar.rotation.z = Math.PI * 0.08;
        group.add(leftEar);
        const rightEar = leftEar.clone();
        rightEar.position.x = 0.12;
        rightEar.rotation.z = -Math.PI * 0.08;
        group.add(rightEar);

        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            emissive: new THREE.Color(0x8ac4ff),
            emissiveIntensity: 0.4,
            roughness: 0.4,
            metalness: 0.1
        });
        const eyeGeo = new THREE.SphereGeometry(0.04, 12, 12);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, bodyHeight + 0.53, 0.35);
        group.add(leftEye);
        this._eyeMeshes.push(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.08;
        group.add(rightEye);
        this._eyeMeshes.push(rightEye);

        const noseGeo = new THREE.ConeGeometry(0.035, 0.08, 10);
        const nose = new THREE.Mesh(noseGeo, maskMat);
        nose.rotation.x = Math.PI / 2;
        nose.position.set(0, bodyHeight + 0.48, 0.39);
        group.add(nose);

        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, bodyHeight + 0.22, -0.2);
        group.add(tailPivot);
        this._tailPivot = tailPivot;

        const tailSegmentGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.18, 10);
        for (let i = 0; i < 4; i += 1) {
            const mat = i % 2 === 0 ? maskMat : stripeMat;
            const segment = new THREE.Mesh(tailSegmentGeo, mat);
            segment.rotation.x = Math.PI / 2;
            segment.position.z = -0.12 - i * 0.14;
            segment.position.y = 0.03;
            segment.castShadow = true;
            tailPivot.add(segment);
        }

        const pawGeo = new THREE.SphereGeometry(0.07, 10, 10);
        const leftPaw = new THREE.Mesh(pawGeo, maskMat);
        leftPaw.position.set(-0.16, bodyHeight + 0.1, 0.2);
        group.add(leftPaw);
        const rightPaw = leftPaw.clone();
        rightPaw.position.x = 0.16;
        group.add(rightPaw);

        if (params?.scale) {
            group.scale.set(params.scale, params.scale, params.scale);
        }

        return group;
    }

    update(dt) {
        this._time += dt;
        const tailSway = Math.sin(this._time * 1.6) * 0.45;
        const lidBob = Math.sin(this._time * 1.2) * 0.08;

        if (this._tailPivot) {
            this._tailPivot.rotation.y = tailSway;
            this._tailPivot.rotation.x = Math.sin(this._time * 0.9) * 0.1;
        }

        if (this._lidPivot) {
            this._lidPivot.rotation.x = -0.2 + lidBob;
        }

        const blinkPhase = Math.sin(this._time * 2.4);
        const blinkScale = blinkPhase > 0.92 ? 0.2 : 1;
        this._eyeMeshes.forEach((eye) => {
            eye.scale.y = blinkScale;
        });
    }
}

EntityRegistry.register('raccoonTrashCan', RaccoonTrashCanEntity);

export { RaccoonTrashCanEntity };
