import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

export class LotusPondEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'lotusPond';
        this._elapsed = Math.random() * Math.PI * 2;
        this._baseY = null;
        this._bobOffset = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Lotus Pond'; }

    createMesh(params) {
        const group = new THREE.Group();

        const waterRadius = randomBetween(1.5, 2.5);
        const waterHeight = 0.12;
        const waterGeo = new THREE.CylinderGeometry(waterRadius, waterRadius, waterHeight, 32);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x4fa5c7,
            emissive: new THREE.Color(0x0d2f4a),
            metalness: 0.05,
            roughness: 0.25,
            transparent: true,
            opacity: 0.82
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = waterHeight * 0.5;
        water.receiveShadow = true;
        group.add(water);

        const padCount = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < padCount; i++) {
            this.#addLilyPad(group, waterRadius);
        }

        group.rotation.y = Math.random() * Math.PI * 2;

        return group;
    }

    #addLilyPad(group, maxRadius) {
        const padRadius = randomBetween(0.35, 0.55);
        const padHeight = 0.08;
        const notchAngle = randomBetween(0.4, 0.8);
        const thetaStart = Math.random() * Math.PI * 2;
        const padGeo = new THREE.CylinderGeometry(padRadius, padRadius, padHeight, 24, 1, false, thetaStart, Math.PI * 2 - notchAngle);
        const padMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.28 + Math.random() * 0.06, 0.55, 0.33 + Math.random() * 0.08),
            roughness: 0.95,
            metalness: 0.05
        });
        const pad = new THREE.Mesh(padGeo, padMat);

        const distance = randomBetween(padRadius * 1.2, maxRadius * 0.75);
        const angle = Math.random() * Math.PI * 2;
        pad.position.set(Math.cos(angle) * distance, padHeight * 0.6, Math.sin(angle) * distance);
        pad.rotation.y = Math.random() * Math.PI * 2;
        pad.castShadow = true;
        pad.receiveShadow = true;

        group.add(pad);

        if (Math.random() > 0.35) {
            const flower = this.#createLotusFlower();
            flower.position.copy(pad.position);
            flower.position.y += padHeight * 0.6;
            group.add(flower);
        }
    }

    #createLotusFlower() {
        const flower = new THREE.Group();
        const petalCount = 6 + Math.floor(Math.random() * 4);
        const petalColor = new THREE.Color().setHSL(0.95 + Math.random() * 0.03, 0.45 + Math.random() * 0.2, 0.75);

        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalGeo = new THREE.ConeGeometry(0.12, 0.32, 10);
            const petalMat = new THREE.MeshStandardMaterial({
                color: petalColor,
                roughness: 0.45,
                metalness: 0.05
            });
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.position.set(Math.cos(angle) * 0.12, 0.15, Math.sin(angle) * 0.12);
            petal.rotation.x = Math.PI / 2.4;
            petal.rotation.z = angle;
            petal.castShadow = true;
            petal.receiveShadow = true;
            flower.add(petal);
        }

        const coreGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffd85c,
            emissive: 0x9c6b1a,
            roughness: 0.35
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 0.18;
        core.castShadow = true;
        core.receiveShadow = true;
        flower.add(core);

        return flower;
    }

    update(dt) {
        if (!this.mesh) return;
        this._elapsed += dt;

        if (this._baseY === null) {
            this._baseY = this.mesh.position.y;
        }

        const bob = Math.sin(this._elapsed * 0.6 + this._bobOffset) * 0.03;
        this.mesh.position.y = this._baseY + bob;
        this.mesh.rotation.y += 0.05 * dt;
    }
}

EntityRegistry.register('lotusPond', LotusPondEntity);
