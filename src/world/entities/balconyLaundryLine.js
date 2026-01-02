import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

function createFabricTexture(primary, secondary) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = secondary;
        const stripeWidth = size * 0.12;
        const x = (i * size) / 6;
        ctx.fillRect(x, 0, stripeWidth, size);
    }

    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = '#000000';
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 2;
    return texture;
}

export class BalconyLaundryLineEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'balconyLaundryLine';
        this._clothPanels = [];
        this._time = Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Balcony Laundry Line'; }

    createMesh(params) {
        const group = new THREE.Group();

        const width = params.width || 3.4 + Math.random() * 0.8;
        const depth = params.depth || 1.6 + Math.random() * 0.4;
        const height = params.height || 2.3 + Math.random() * 0.3;

        this.params.width = width;
        this.params.depth = depth;
        this.params.height = height;

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x3a3f4a,
            metalness: 0.55,
            roughness: 0.4
        });
        const slabMat = new THREE.MeshStandardMaterial({
            color: 0x8a8c92,
            roughness: 0.8
        });
        const railingMat = new THREE.MeshStandardMaterial({
            color: 0x5a6c75,
            metalness: 0.35,
            roughness: 0.5
        });

        const slabGeo = new THREE.BoxGeometry(1, 1, 1);
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.scale.set(width, 0.2, depth);
        slab.position.set(0, 0.1, 0);
        slab.receiveShadow = true;
        group.add(slab);

        const railingGeo = new THREE.BoxGeometry(1, 1, 1);
        const railHeight = height * 0.45;
        const railThickness = 0.08;
        const rail = new THREE.Mesh(railingGeo, railingMat);
        rail.scale.set(width * 0.95, railHeight, railThickness);
        rail.position.set(0, railHeight / 2 + 0.2, depth / 2 - railThickness * 0.6);
        rail.castShadow = true;
        group.add(rail);

        const postGeo = new THREE.CylinderGeometry(0.06, 0.06, height, 10);
        const postOffsets = [-width * 0.45, width * 0.45];
        postOffsets.forEach((x) => {
            const post = new THREE.Mesh(postGeo, frameMat);
            post.position.set(x, height / 2 + 0.1, -depth / 4);
            post.castShadow = true;
            group.add(post);
        });

        const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, width * 0.9, 12);
        const line = new THREE.Mesh(lineGeo, frameMat);
        line.rotation.z = Math.PI / 2;
        line.position.set(0, height * 0.85, -depth / 4);
        line.castShadow = true;
        group.add(line);

        const clothGroup = new THREE.Group();
        clothGroup.position.set(0, height * 0.7, -depth / 4);
        group.add(clothGroup);

        const palette = [
            ['#f4d7d7', '#c9686c'],
            ['#d7e7f4', '#3c6a95'],
            ['#f2e7c9', '#b78c4a'],
            ['#e1f4d7', '#4c8c5c']
        ];

        const clothGeo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
        const clothCount = 3 + Math.floor(Math.random() * 2);
        const spacing = width * 0.75 / clothCount;
        const startX = -((clothCount - 1) * spacing) / 2;

        for (let i = 0; i < clothCount; i++) {
            const [primary, secondary] = palette[i % palette.length];
            const clothMat = new THREE.MeshStandardMaterial({
                map: createFabricTexture(primary, secondary),
                color: 0xffffff,
                roughness: 0.9
            });
            const cloth = new THREE.Mesh(clothGeo, clothMat);
            cloth.position.set(startX + spacing * i, -0.35 - Math.random() * 0.1, 0);
            cloth.rotation.z = (Math.random() - 0.5) * 0.2;
            cloth.castShadow = true;
            clothGroup.add(cloth);
            this._clothPanels.push({ mesh: cloth, baseRotation: cloth.rotation.z, phase: Math.random() * Math.PI * 2 });
        }

        const clipGeo = new THREE.BoxGeometry(0.08, 0.05, 0.08);
        const clipMat = new THREE.MeshStandardMaterial({
            color: 0x2e2e2e,
            roughness: 0.6
        });
        this._clothPanels.forEach((panel) => {
            const clip = new THREE.Mesh(clipGeo, clipMat);
            clip.position.set(panel.mesh.position.x, 0.05, 0.03);
            clip.castShadow = true;
            clothGroup.add(clip);
        });

        return group;
    }

    update(dt) {
        this._time += dt;
        const sway = Math.sin(this._time * 1.6) * 0.18;
        this._clothPanels.forEach((panel) => {
            panel.mesh.rotation.z = panel.baseRotation + sway * Math.cos(this._time + panel.phase);
            panel.mesh.rotation.x = 0.12 + Math.sin(this._time * 2.2 + panel.phase) * 0.08;
        });
    }
}

EntityRegistry.register('balconyLaundryLine', BalconyLaundryLineEntity);
