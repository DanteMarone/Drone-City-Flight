import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

// --- Shared Geometries ---
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
coneGeo.rotateY(Math.PI / 4); // Align to box edges

/**
 * Modern House: Flat roof, clean lines, large windows, concrete/wood textures.
 */
export class HouseModernEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'house_modern';
    }

    static get displayName() { return 'House Modern'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 12;
        const h = params.height || 6;
        const d = params.depth || 12;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        // Main Block (Concrete)
        const texConcrete = TextureGenerator.createConcrete();
        const matConcrete = new THREE.MeshStandardMaterial({ map: texConcrete, color: 0xeeeeee });

        const mainBlock = new THREE.Mesh(boxGeo, matConcrete);
        mainBlock.scale.set(w * 0.7, h, d);
        mainBlock.position.set(-w * 0.15, h / 2, 0);
        mainBlock.castShadow = true;
        mainBlock.receiveShadow = true;
        group.add(mainBlock);

        // Accent Block (Wood/Darker)
        const accentColor = Math.random() > 0.5 ? 0x886644 : 0x444444;
        const matAccent = new THREE.MeshStandardMaterial({ color: accentColor });

        const accentBlock = new THREE.Mesh(boxGeo, matAccent);
        accentBlock.scale.set(w * 0.4, h * 0.8, d * 0.6);
        accentBlock.position.set(w * 0.3, h * 0.4, d * 0.3); // Offset overlap
        accentBlock.castShadow = true;
        accentBlock.receiveShadow = true;
        group.add(accentBlock);

        // Flat Roof Parapet
        const parapet = new THREE.Mesh(boxGeo, matConcrete);
        parapet.scale.set(w * 0.72, 0.5, d + 0.2);
        parapet.position.set(-w * 0.15, h + 0.25, 0);
        group.add(parapet);

        // Large Window
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.8,
            emissive: 0x112244,
            emissiveIntensity: 0.5
        });
        const windowPane = new THREE.Mesh(boxGeo, glassMat);
        windowPane.scale.set(0.2, h * 0.6, d * 0.4);
        windowPane.position.set(-w * 0.5, h * 0.5, 0); // Stick out slightly
        group.add(windowPane);

        return group;
    }
}

/**
 * Cottage House: Brick walls, steep roof, chimney.
 */
export class HouseCottageEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'house_cottage';
    }

    static get displayName() { return 'House Cottage'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 10;
        const h = params.height || 5; // Body height
        const d = params.depth || 8;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        // Brick Body
        const texBrick = TextureGenerator.createBrick({
            color: '#8b4513',
            rows: 15,
            cols: 8
        });
        const matBrick = new THREE.MeshStandardMaterial({ map: texBrick });

        const body = new THREE.Mesh(boxGeo, matBrick);
        body.scale.set(w, h, d);
        body.position.set(0, h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Steep Roof
        const roofH = h * 0.8;
        const matRoof = new THREE.MeshStandardMaterial({ color: 0x333344 });
        const roof = new THREE.Mesh(coneGeo, matRoof);
        const roofScale = Math.max(w, d) * 0.85; // Base of pyramid
        // Non-uniform scale for cone to match rectangular house?
        // ConeGeometry is round/pyramid base. 4 segments = Pyramid.
        // Scale x/z to match w/d.
        roof.scale.set(w * 0.8, roofH, d * 0.8);
        roof.position.set(0, h + roofH / 2, 0);
        roof.castShadow = true;
        group.add(roof);

        // Chimney
        const chimney = new THREE.Mesh(boxGeo, matBrick);
        chimney.scale.set(1.5, h, 1.5);
        chimney.position.set(w * 0.3, h * 1.2, -d * 0.2);
        group.add(chimney);

        // Door
        const door = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x553322 }));
        door.scale.set(1.5, 2.5, 0.2);
        door.position.set(0, 1.25, d / 2);
        group.add(door);

        return group;
    }
}

/**
 * Apartment Block: 3-story walk-up with balconies.
 */
export class ApartmentBlockEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'apartment_block';
    }

    static get displayName() { return 'Apartment Block'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 16;
        const floorHeight = 4;
        const floors = 3;
        const h = floorHeight * floors;
        const d = params.depth || 16;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        // Facade Texture (Tan Brick)
        const texFacade = TextureGenerator.createBuildingFacade({
            color: '#ccbbaa',
            windowColor: '#223344',
            floors: floors,
            cols: 4,
            width: 256,
            height: 256
        });
        const matWall = new THREE.MeshStandardMaterial({ map: texFacade });

        const body = new THREE.Mesh(boxGeo, matWall);
        body.scale.set(w, h, d);
        body.position.set(0, h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Roof Trim
        const trim = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x554433 }));
        trim.scale.set(w + 1, 0.5, d + 1);
        trim.position.set(0, h, 0);
        group.add(trim);

        // Balconies
        const balMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        for (let i = 1; i < floors; i++) {
            // Front balconies
            const bal = new THREE.Mesh(boxGeo, balMat);
            bal.scale.set(4, 1, 2);
            // Place 2 balconies per floor
            bal.position.set(-w / 4, i * floorHeight, d / 2 + 1);
            group.add(bal);

            const bal2 = bal.clone();
            bal2.position.set(w / 4, i * floorHeight, d / 2 + 1);
            group.add(bal2);
        }

        // Entrance Canopy
        const canopy = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x334455 }));
        canopy.scale.set(4, 0.2, 3);
        canopy.position.set(0, 3, d / 2 + 1.5);
        group.add(canopy);

        return group;
    }
}

// Register all
EntityRegistry.register('house_modern', HouseModernEntity);
EntityRegistry.register('house_cottage', HouseCottageEntity);
EntityRegistry.register('apartment_block', ApartmentBlockEntity);
