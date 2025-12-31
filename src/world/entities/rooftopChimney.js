import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

export class RooftopChimneyEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'rooftopChimney';
        this.time = Math.random() * 10;
        this.smokePuffs = [];
        this.smokeBaseY = 0;
    }

    static get displayName() { return 'Rooftop Chimney'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseWidth = params.baseWidth || 1.6;
        const stackWidth = params.stackWidth || 0.9;
        const stackHeight = params.stackHeight || 2.6;
        const baseHeight = 0.25;
        const capHeight = 0.2;
        const flueHeight = 0.6;

        this.params.baseWidth = baseWidth;
        this.params.stackWidth = stackWidth;
        this.params.stackHeight = stackHeight;

        const brickTexture = TextureGenerator.createBrick({
            color: '#8a4a3c',
            rows: 8,
            cols: 4
        });

        const brickMat = new THREE.MeshStandardMaterial({
            map: brickTexture,
            roughness: 0.85
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x6b6f77,
            roughness: 0.35,
            metalness: 0.6
        });

        const sootMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.95
        });

        const baseGeo = new THREE.BoxGeometry(baseWidth, baseHeight, baseWidth);
        baseGeo.translate(0, baseHeight / 2, 0);
        const base = new THREE.Mesh(baseGeo, metalMat);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const stackGeo = new THREE.BoxGeometry(stackWidth, stackHeight, stackWidth);
        stackGeo.translate(0, stackHeight / 2 + baseHeight, 0);
        const stack = new THREE.Mesh(stackGeo, brickMat);
        stack.castShadow = true;
        stack.receiveShadow = true;
        group.add(stack);

        const capGeo = new THREE.BoxGeometry(stackWidth * 1.2, capHeight, stackWidth * 1.2);
        capGeo.translate(0, baseHeight + stackHeight + capHeight / 2, 0);
        const cap = new THREE.Mesh(capGeo, metalMat);
        cap.castShadow = true;
        group.add(cap);

        const flueGeo = new THREE.CylinderGeometry(stackWidth * 0.28, stackWidth * 0.32, flueHeight, 10);
        flueGeo.translate(0, baseHeight + stackHeight + capHeight + flueHeight / 2, 0);
        const flue = new THREE.Mesh(flueGeo, sootMat);
        flue.castShadow = true;
        group.add(flue);

        const smokeGroup = new THREE.Group();
        smokeGroup.position.y = baseHeight + stackHeight + capHeight + flueHeight;
        group.add(smokeGroup);
        this.smokeGroup = smokeGroup;

        const puffGeo = new THREE.SphereGeometry(0.25, 10, 10);
        const puffCount = 4;
        this.smokeBaseY = smokeGroup.position.y + 0.1;

        for (let i = 0; i < puffCount; i++) {
            const puffMat = new THREE.MeshStandardMaterial({
                color: 0xdedede,
                transparent: true,
                opacity: 0.5,
                roughness: 1
            });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            const driftX = (Math.random() - 0.5) * 0.5;
            const driftZ = (Math.random() - 0.5) * 0.5;
            puff.userData = {
                offset: i * 0.35,
                speed: 0.35 + Math.random() * 0.25,
                driftX,
                driftZ
            };
            puff.position.set(driftX * 0.1, this.smokeBaseY + i * 0.35, driftZ * 0.1);
            puff.castShadow = false;
            smokeGroup.add(puff);
            this.smokePuffs.push(puff);
        }

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.time += dt;

        const maxRise = 1.6;
        const baseY = this.smokeBaseY;

        this.smokePuffs.forEach((puff, index) => {
            const data = puff.userData;
            const cycle = (this.time * data.speed + data.offset + index * 0.1) % 1;
            const y = baseY + cycle * maxRise;
            const scale = 0.4 + cycle * 0.7;

            puff.position.y = y;
            puff.position.x = data.driftX * cycle;
            puff.position.z = data.driftZ * cycle;
            puff.scale.setScalar(scale);
            puff.material.opacity = 0.6 * (1 - cycle);
        });
    }
}

EntityRegistry.register('rooftopChimney', RooftopChimneyEntity);
