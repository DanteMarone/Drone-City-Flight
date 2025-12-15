import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 32);
const hexGeo = new THREE.CylinderGeometry(1, 1, 1, 6);

/**
 * A small commercial building (Fast Food / Diner) with a rotating sign.
 */
export class BurgerJointEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'burger_joint';
        this.signMesh = null;
    }

    static get displayName() { return 'Burger Joint'; }

    createMesh(params) {
        const width = params.width || 12;
        const depth = params.depth || 10;
        const height = params.height || 5;

        const group = new THREE.Group();

        // Main Building
        const wallsMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0xffaa00, // Orange tint
            roughness: 0.8
        });
        const walls = new THREE.Mesh(boxGeo, wallsMat);
        walls.scale.set(width, height, depth);
        walls.position.y = height / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        group.add(walls);

        // Roof / Parapet
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 }); // Red roof
        const roof = new THREE.Mesh(boxGeo, roofMat);
        roof.scale.set(width + 1, 0.5, depth + 1);
        roof.position.y = height + 0.25;
        group.add(roof);

        // Sign Pole
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
        const pole = new THREE.Mesh(cylinderGeo, poleMat);
        pole.scale.set(0.3, 8, 0.3);
        pole.position.set(width / 2 - 1, 4, depth / 2 - 1);
        group.add(pole);

        // Rotating Sign
        const signMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x550000
        });

        const signPivot = new THREE.Group();
        signPivot.position.set(width / 2 - 1, 8, depth / 2 - 1);

        // Add the physical sign to the pivot
        // Let's make it a burger shape? (Sphere + Cylinder + Sphere)
        // Keep it simple: A big disc.
        const disc = new THREE.Mesh(cylinderGeo, signMat);
        disc.scale.set(2, 0.4, 2);
        disc.rotation.x = Math.PI / 2; // Facing the street
        signPivot.add(disc);

        group.add(signPivot);
        this.signMesh = signPivot;

        return group;
    }

    update(dt) {
        if (this.signMesh) {
            this.signMesh.rotation.y += dt * 1.0; // Rotate slowly
        }
    }
}

/**
 * A medium-sized office park building with an L-shape layout.
 */
export class OfficeParkEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'office_park';
    }

    static get displayName() { return 'Office Park'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Dimensions
        const hMain = 15 + Math.random() * 5; // 3-4 stories
        const wMain = 20;
        const dMain = 10;

        const hWing = hMain * 0.7;
        const wWing = 10;
        const dWing = 15;

        // Texture
        const facadeTex = TextureGenerator.createBuildingFacade({
            color: '#dddddd',
            windowColor: '#335577',
            floors: Math.floor(hMain / 3),
            cols: Math.floor(wMain / 3)
        });
        const mat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.3 });

        // Main Block
        const mainBlock = new THREE.Mesh(boxGeo, mat);
        mainBlock.scale.set(wMain, hMain, dMain);
        mainBlock.position.set(0, hMain / 2, 0);
        mainBlock.castShadow = true;
        mainBlock.receiveShadow = true;
        group.add(mainBlock);

        // Wing Block (Offset to form L)
        const wingBlock = new THREE.Mesh(boxGeo, mat);
        wingBlock.scale.set(wWing, hWing, dWing);
        // Position: attached to the side, extending back
        wingBlock.position.set(wMain / 2 + wWing / 2 - 2, hWing / 2, dMain / 2 + dWing / 2 - 2);
        // -2 overlap to look connected
        wingBlock.castShadow = true;
        wingBlock.receiveShadow = true;
        group.add(wingBlock);

        // Entrance Canopy
        const canopy = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        canopy.scale.set(6, 0.5, 4);
        canopy.position.set(0, 3, dMain / 2 + 2);
        group.add(canopy);

        // HVAC on roof
        const hvac = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x999999 }));
        hvac.scale.set(4, 2, 4);
        hvac.position.set(0, hMain + 1, 0);
        group.add(hvac);

        return group;
    }
}

/**
 * A large modern skyscraper with a hexagonal tiered design.
 */
export class ModernTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'modern_tower';
    }

    static get displayName() { return 'Modern Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseHeight = params.height || (60 + Math.random() * 40);
        const baseRadius = params.width ? params.width / 2 : 12;

        // 3 Tiers
        const tiers = 3;
        const tierHeight = baseHeight / tiers;

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });

        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        for (let i = 0; i < tiers; i++) {
            const r = baseRadius * (1 - (i * 0.2)); // Shrink each tier
            const h = tierHeight;
            const y = (i * tierHeight) + (h / 2);

            const mesh = new THREE.Mesh(hexGeo, glassMat);
            mesh.scale.set(r, h, r);
            mesh.position.y = y;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);

            // Separator ring
            if (i < tiers - 1) {
                const ring = new THREE.Mesh(hexGeo, frameMat);
                ring.scale.set(r + 0.5, 1, r + 0.5);
                ring.position.y = (i + 1) * tierHeight;
                group.add(ring);
            }
        }

        // Antenna
        const antennaH = 15;
        const antenna = new THREE.Mesh(cylinderGeo, frameMat);
        antenna.scale.set(0.5, antennaH, 0.5);
        antenna.position.y = baseHeight + antennaH / 2;
        group.add(antenna);

        // Warning light
        const lightGeo = new THREE.SphereGeometry(1, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.y = baseHeight + antennaH;
        group.add(light);
        this.lightMesh = light;

        return group;
    }

    update(dt) {
        if (this.lightMesh) {
            // Blink
            const time = Date.now() * 0.005;
            this.lightMesh.visible = Math.sin(time) > 0;
        }
    }

    // Override collider to be simple box or cylinder?
    // BaseEntity default uses setFromObject which should be fine for the group.
}

// Register all entities
EntityRegistry.register('burger_joint', BurgerJointEntity);
EntityRegistry.register('office_park', OfficeParkEntity);
EntityRegistry.register('modern_tower', ModernTowerEntity);
