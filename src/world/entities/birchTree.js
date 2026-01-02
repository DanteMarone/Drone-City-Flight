import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

let birchBarkTexture;

const getBirchBarkTexture = () => {
    if (birchBarkTexture) return birchBarkTexture.clone();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f1f0e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 140; i++) {
        const width = 20 + Math.random() * 50;
        const height = 6 + Math.random() * 10;
        const x = Math.random() * (canvas.width - width);
        const y = Math.random() * (canvas.height - height);
        const shade = 30 + Math.random() * 40;
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.6)`;
        ctx.fillRect(x, y, width, height);
    }

    for (let i = 0; i < 220; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(120, 120, 120, 0.2)';
        ctx.fillRect(x, y, 2, 6);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);

    birchBarkTexture = texture;
    return texture.clone();
};

/**
 * Birch Tree
 * Bright bark trunk with airy foliage and gentle sway.
 */
export class BirchTreeEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'birchTree';
        this.swayTime = Math.random() * Math.PI * 2;
        this.swayGroup = null;
    }

    static get displayName() { return 'Birch Tree'; }

    createMesh(params) {
        const group = new THREE.Group();

        const trunkHeight = 3.2;
        const trunkRadius = 0.3;
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.9, trunkRadius * 1.1, trunkHeight, 10);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            map: getBirchBarkTexture(),
            roughness: 0.85
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const branchMaterial = new THREE.MeshStandardMaterial({
            color: 0xb8b3a6,
            roughness: 0.9
        });

        const branchGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6);
        const branchOffsets = [
            { x: 0.35, y: 2.2, z: 0.1, rotZ: 0.6 },
            { x: -0.35, y: 2.4, z: -0.1, rotZ: -0.5 },
            { x: 0.15, y: 2.7, z: -0.35, rotX: 0.5, rotZ: 0.3 }
        ];

        branchOffsets.forEach((offset) => {
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.set(offset.x, offset.y, offset.z);
            branch.rotation.z = offset.rotZ || 0;
            branch.rotation.x = offset.rotX || 0;
            branch.castShadow = true;
            branch.receiveShadow = true;
            group.add(branch);
        });

        const canopyGroup = new THREE.Group();
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x6cab4a,
            roughness: 0.8,
            flatShading: true
        });
        const canopyGeometry = new THREE.SphereGeometry(1, 7, 7);
        const canopyBlobs = [
            { x: 0, y: trunkHeight + 1.4, z: 0, s: 1.4 },
            { x: 0.6, y: trunkHeight + 1.2, z: 0.3, s: 1.1 },
            { x: -0.7, y: trunkHeight + 1.0, z: -0.3, s: 1.0 },
            { x: 0.2, y: trunkHeight + 0.8, z: -0.7, s: 0.95 },
            { x: -0.3, y: trunkHeight + 1.6, z: 0.6, s: 0.85 }
        ];

        canopyBlobs.forEach((blob) => {
            const sphere = new THREE.Mesh(canopyGeometry, foliageMaterial);
            sphere.position.set(blob.x, blob.y, blob.z);
            sphere.scale.set(blob.s, blob.s, blob.s);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            canopyGroup.add(sphere);
        });

        canopyGroup.position.y = 0;
        group.add(canopyGroup);
        this.swayGroup = canopyGroup;

        const scale = 0.95 + Math.random() * 0.2;
        group.scale.set(scale, scale, scale);

        return group;
    }

    update(dt) {
        if (!this.swayGroup) return;
        this.swayTime += dt * 0.6;
        const sway = Math.sin(this.swayTime) * 0.08;
        const swaySide = Math.cos(this.swayTime * 0.7) * 0.05;
        this.swayGroup.rotation.z = sway;
        this.swayGroup.rotation.x = swaySide;
    }
}

EntityRegistry.register('birchTree', BirchTreeEntity);
