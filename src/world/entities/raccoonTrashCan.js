import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class RaccoonTrashCanEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'raccoon_trash_can';
        this._time = Math.random() * Math.PI * 2;
        this._lidPivot = null;
        this._raccoonPivot = null;
        this._raccoonBaseHeight = 0;
        this.params.seed = params.seed ?? Math.random();
    }

    static get displayName() { return 'Raccoon Trash Can'; }

    createMesh() {
        const group = new THREE.Group();
        const rng = this.params.seed;
        const size = 0.85 + rng * 0.2;
        const canHeight = 1.15 * size;
        const canRadius = 0.4 * size;
        const lidOffset = 0.08 + rng * 0.06;

        const canColor = new THREE.Color().setHSL(0.55 + rng * 0.1, 0.25, 0.38 + rng * 0.12);
        const lidColor = new THREE.Color().setHSL(0.52 + rng * 0.08, 0.18, 0.55);
        const raccoonFur = new THREE.Color().setHSL(0.05 + rng * 0.04, 0.08, 0.22 + rng * 0.1);
        const raccoonMask = new THREE.Color(0x1b1b1b);
        const metalMat = new THREE.MeshStandardMaterial({
            color: canColor,
            roughness: 0.55,
            metalness: 0.35
        });
        const lidMat = new THREE.MeshStandardMaterial({
            color: lidColor,
            roughness: 0.4,
            metalness: 0.6
        });
        const furMat = new THREE.MeshStandardMaterial({
            color: raccoonFur,
            roughness: 0.85,
            metalness: 0.05
        });
        const maskMat = new THREE.MeshStandardMaterial({
            color: raccoonMask,
            roughness: 0.7,
            metalness: 0.05
        });

        const canGeo = new THREE.CylinderGeometry(canRadius, canRadius * 0.96, canHeight, 16);
        const can = new THREE.Mesh(canGeo, metalMat);
        can.position.y = canHeight / 2;
        can.castShadow = true;
        can.receiveShadow = true;
        group.add(can);

        const rimGeo = new THREE.TorusGeometry(canRadius * 0.98, 0.03 * size, 10, 24);
        const rim = new THREE.Mesh(rimGeo, lidMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = canHeight;
        rim.castShadow = true;
        group.add(rim);

        const baseGeo = new THREE.CylinderGeometry(canRadius * 0.92, canRadius, 0.12 * size, 14);
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.position.y = 0.06 * size;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const lidPivot = new THREE.Group();
        lidPivot.position.set(0, canHeight + 0.02 * size, 0);
        group.add(lidPivot);
        this._lidPivot = lidPivot;

        const lidGeo = new THREE.CylinderGeometry(canRadius * 1.02, canRadius * 1.08, 0.08 * size, 16);
        const lid = new THREE.Mesh(lidGeo, lidMat);
        lid.position.set(0, 0, lidOffset);
        lid.castShadow = true;
        lid.receiveShadow = true;
        lidPivot.add(lid);

        const handleGeo = new THREE.TorusGeometry(canRadius * 0.35, 0.02 * size, 8, 18, Math.PI);
        const handle = new THREE.Mesh(handleGeo, lidMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.set(0, 0.06 * size, canRadius * 0.45 + lidOffset);
        lidPivot.add(handle);

        const raccoonPivot = new THREE.Group();
        raccoonPivot.position.set(0, canHeight * 0.62, 0);
        this._raccoonBaseHeight = raccoonPivot.position.y;
        group.add(raccoonPivot);
        this._raccoonPivot = raccoonPivot;

        const bodyGeo = new THREE.SphereGeometry(0.28 * size, 16, 16);
        const body = new THREE.Mesh(bodyGeo, furMat);
        body.scale.set(1.2, 1, 1);
        body.position.set(0, 0, 0);
        body.castShadow = true;
        raccoonPivot.add(body);

        const headGeo = new THREE.SphereGeometry(0.18 * size, 16, 16);
        const head = new THREE.Mesh(headGeo, furMat);
        head.position.set(0, 0.22 * size, 0.12 * size);
        head.castShadow = true;
        raccoonPivot.add(head);

        const maskGeo = new THREE.SphereGeometry(0.14 * size, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8);
        const mask = new THREE.Mesh(maskGeo, maskMat);
        mask.position.set(0, 0.21 * size, 0.2 * size);
        mask.rotation.x = -0.2;
        raccoonPivot.add(mask);

        const earGeo = new THREE.ConeGeometry(0.05 * size, 0.12 * size, 10);
        [-1, 1].forEach((dir) => {
            const ear = new THREE.Mesh(earGeo, furMat);
            ear.position.set(0.09 * size * dir, 0.36 * size, 0.06 * size);
            ear.rotation.x = -0.3;
            ear.castShadow = true;
            raccoonPivot.add(ear);
        });

        const tailMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1,
            map: this.createTailTexture()
        });
        const tailGeo = new THREE.CylinderGeometry(0.05 * size, 0.07 * size, 0.5 * size, 10);
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(-0.26 * size, 0.08 * size, -0.1 * size);
        tail.rotation.z = Math.PI / 2.6;
        tail.rotation.y = Math.PI / 3;
        tail.castShadow = true;
        raccoonPivot.add(tail);

        const pawGeo = new THREE.SphereGeometry(0.05 * size, 10, 10);
        [-1, 1].forEach((dir) => {
            const paw = new THREE.Mesh(pawGeo, maskMat);
            paw.position.set(0.16 * size * dir, 0.05 * size, 0.18 * size);
            raccoonPivot.add(paw);
        });

        return group;
    }

    createTailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#8f8f8f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#2a2a2a';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(0, i * 10 + 4, canvas.width, 6);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.8, 1.2);
        return texture;
    }

    update(dt) {
        if (!this._lidPivot || !this._raccoonPivot) return;
        this._time += dt;
        const lidWobble = Math.sin(this._time * 1.8) * 0.12;
        this._lidPivot.rotation.x = lidWobble - 0.2;

        const raccoonBob = Math.sin(this._time * 1.4) * 0.06;
        this._raccoonPivot.position.y = this._raccoonBaseHeight + raccoonBob;
        this._raccoonPivot.rotation.y = Math.sin(this._time * 0.8) * 0.25;
    }
}

EntityRegistry.register('raccoon_trash_can', RaccoonTrashCanEntity);
