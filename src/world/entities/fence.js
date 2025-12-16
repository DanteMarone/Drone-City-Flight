import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const DEFAULT_LENGTH = 8;

function createPost(material, height, depth = 0.25, width = 0.25) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    post.position.y = height / 2;
    post.castShadow = true;
    post.receiveShadow = true;
    return post;
}

function createRail(material, length, height, thickness = 0.15) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, thickness), material);
    rail.position.y = height;
    rail.castShadow = true;
    rail.receiveShadow = true;
    return rail;
}

function distributePosts(group, count, span, builder) {
    const spacing = span / (count - 1);
    for (let i = 0; i < count; i++) {
        const post = builder();
        post.position.x = -span / 2 + spacing * i;
        group.add(post);
    }
}

class FenceBase extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.length = params.length || DEFAULT_LENGTH;
        this.height = params.height || 1.5;
    }

    createCollider() {
        if (!this.mesh) return null;
        const box = new THREE.Box3().setFromObject(this.mesh);
        // Widen slightly so fast movers don't clip tiny fences
        box.min.z -= 0.1;
        box.max.z += 0.1;
        return box;
    }
}

export class WoodenFenceEntity extends FenceBase {
    constructor(params = {}) {
        super(params);
        this.type = 'woodenFence';
    }

    static get displayName() { return 'Wooden Fence'; }

    createMesh(params) {
        const length = params.length || this.length;
        const height = params.height || this.height;
        this.params.length = length;
        this.params.height = height;

        const group = new THREE.Group();
        const woodColor = new THREE.Color().setHSL(0.08, 0.55, 0.35);
        const material = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.7, metalness: 0.05 });

        const postCount = Math.max(2, Math.round(length / 2) + 1);
        distributePosts(group, postCount, length, () => createPost(material, height, 0.25, 0.22));

        const lowerRail = createRail(material, length, height * 0.45, 0.18);
        const upperRail = createRail(material, length, height * 0.8, 0.18);
        group.add(lowerRail, upperRail);

        // Add random vertical planks between rails for coverage
        const plankGeo = new THREE.BoxGeometry(0.2, height * 0.9, 0.08);
        const plankCount = Math.max(4, Math.floor(length * 1.2));
        for (let i = 0; i < plankCount; i++) {
            const plank = new THREE.Mesh(plankGeo, material);
            plank.position.x = -length / 2 + (i / (plankCount - 1)) * length;
            plank.position.y = height * 0.45;
            plank.castShadow = true;
            plank.receiveShadow = true;
            group.add(plank);
        }

        return group;
    }
}

export class PicketFenceEntity extends FenceBase {
    constructor(params = {}) {
        super(params);
        this.type = 'picketFence';
    }

    static get displayName() { return 'White Picket Fence'; }

    createMesh(params) {
        const length = params.length || this.length;
        const height = params.height || this.height * 0.8;
        this.params.length = length;
        this.params.height = height;

        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.05 });

        const postCount = Math.max(2, Math.round(length / 1.5) + 1);
        distributePosts(group, postCount, length, () => createPost(material, height * 0.95, 0.18, 0.18));

        const railHeight = height * 0.45;
        const lowerRail = createRail(material, length, railHeight, 0.12);
        const upperRail = createRail(material, length, railHeight + 0.2, 0.1);
        group.add(lowerRail, upperRail);

        const picketCount = Math.max(5, Math.floor(length / 0.35));
        for (let i = 0; i < picketCount; i++) {
            const picket = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, height * 0.9, 0.06), material);
            body.position.y = height * 0.45;
            body.castShadow = true;
            body.receiveShadow = true;

            const tipGeo = new THREE.ConeGeometry(0.08, 0.18, 4);
            const tip = new THREE.Mesh(tipGeo, material);
            tip.position.y = height * 0.9 + 0.09;
            tip.rotation.y = Math.PI / 4;
            tip.castShadow = true;
            tip.receiveShadow = true;

            picket.add(body, tip);
            picket.position.x = -length / 2 + (i / (picketCount - 1)) * length;
            group.add(picket);
        }

        return group;
    }
}

export class ChainLinkFenceEntity extends FenceBase {
    constructor(params = {}) {
        super(params);
        this.type = 'chainLinkFence';
    }

    static get displayName() { return 'Chain Link Fence'; }

    createMesh(params) {
        const length = params.length || this.length;
        const height = params.height || this.height * 1.1;
        this.params.length = length;
        this.params.height = height;

        const group = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.5, metalness: 0.8 });

        const postCount = Math.max(2, Math.round(length / 3) + 1);
        distributePosts(group, postCount, length, () => createPost(steelMat, height, 0.16, 0.16));

        const rail = createRail(steelMat, length, height - 0.15, 0.12);
        group.add(rail);

        const meshGeo = new THREE.PlaneGeometry(length, height - 0.2, Math.max(2, Math.floor(length)), 6);
        const meshMat = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            metalness: 0.75,
            roughness: 0.35,
            wireframe: true,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const meshPanel = new THREE.Mesh(meshGeo, meshMat);
        meshPanel.position.y = (height - 0.2) / 2 + 0.1;
        meshPanel.castShadow = true;
        meshPanel.receiveShadow = true;
        group.add(meshPanel);

        return group;
    }
}

export class CementWallEntity extends FenceBase {
    constructor(params = {}) {
        super(params);
        this.type = 'cementWall';
    }

    static get displayName() { return 'Cement Wall'; }

    createMesh(params) {
        const length = params.length || this.length;
        const height = params.height || this.height * 1.2;
        const thickness = params.thickness || 0.6;
        this.params.length = length;
        this.params.height = height;
        this.params.thickness = thickness;

        const group = new THREE.Group();

        const texture = TextureGenerator.createConcrete();
        texture.repeat.set(Math.max(1, length / 2), Math.max(1, height / 1.5));
        const wallMat = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xb0b0b0,
            roughness: 0.8,
            metalness: 0.1
        });

        const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), wallMat);
        wall.position.y = height / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);

        const capMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6, metalness: 0.1 });
        const cap = new THREE.Mesh(new THREE.BoxGeometry(length * 1.02, 0.15, thickness * 1.1), capMat);
        cap.position.y = height + 0.075;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);

        return group;
    }
}

EntityRegistry.register('woodenFence', WoodenFenceEntity);
EntityRegistry.register('picketFence', PicketFenceEntity);
EntityRegistry.register('chainLinkFence', ChainLinkFenceEntity);
EntityRegistry.register('cementWall', CementWallEntity);
