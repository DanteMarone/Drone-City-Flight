import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

// Texture generation for crystal surface details
const createCrystalTexture = () => {
    // Check if we are in a headless environment (Node.js) without canvas support
    if (typeof document === 'undefined') {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#a0c0ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sharp lines/cracks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
        ctx.stroke();
    }

    // Gradient overlay for depth
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(1, 'rgba(0, 50, 150, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

export class GiantCrystalEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.time = Math.random() * 100;
        this.crystals = [];
    }

    static get displayName() { return 'Giant Crystal Cluster'; }

    createMesh() {
        const group = new THREE.Group();
        const texture = createCrystalTexture();

        const material = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            emissive: 0x112266,
            roughness: 0.2,
            metalness: 0.8,
            map: texture,
            flatShading: true
        });

        const count = 5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < count; i++) {
            const height = 2 + Math.random() * 3;
            const radius = 0.3 + Math.random() * 0.4;
            // 3 to 6 sides for crystal look
            const sides = 3 + Math.floor(Math.random() * 4);

            const geo = new THREE.CylinderGeometry(0, radius, height, sides);
            const mesh = new THREE.Mesh(geo, material);

            // Random tilt
            const angle = Math.random() * Math.PI * 2;
            const tilt = Math.random() * 0.5;

            mesh.position.x = Math.cos(angle) * (radius * 1.5);
            mesh.position.z = Math.sin(angle) * (radius * 1.5);
            mesh.position.y = height / 2;

            mesh.rotation.x = (Math.random() - 0.5) * tilt;
            mesh.rotation.z = (Math.random() - 0.5) * tilt;

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            group.add(mesh);

            this.crystals.push({
                mesh: mesh,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }

        // Add a floating shard
        const shardGeo = new THREE.OctahedronGeometry(0.3);
        const shard = new THREE.Mesh(shardGeo, material);
        shard.position.y = 4.5;
        group.add(shard);

        this.shard = shard;

        return group;
    }

    createCollider() {
        // Return a box roughly the size of the cluster
        const box = new THREE.Box3();
        box.setFromCenterAndSize(
            new THREE.Vector3(0, 2.5, 0),
            new THREE.Vector3(3, 5, 3)
        );
        return box;
    }

    update(dt) {
        this.time += dt;

        // Pulse glow
        const pulse = 0.2 + Math.sin(this.time) * 0.1;
        // Accessing material from one of the crystals (shared material)
        if (this.crystals.length > 0) {
            this.crystals[0].mesh.material.emissiveIntensity = 0.5 + pulse;
        }

        // Float the shard
        if (this.shard) {
            this.shard.position.y = 4.5 + Math.sin(this.time * 0.5) * 0.5;
            this.shard.rotation.y += dt;
            this.shard.rotation.x += dt * 0.5;
        }
    }
}

EntityRegistry.register('giantCrystal', GiantCrystalEntity);
