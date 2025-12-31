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

    postInit() {
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            // Light near the window
            const localPos = new THREE.Vector3(-this.params.width * 0.5 - 2, this.params.height * 0.5, 0);
            const worldPos = localPos.applyMatrix4(this.mesh.matrixWorld);
            // Warm White (0xFFCCAA)
            const vl = window.app.world.lightSystem.register(worldPos, 0xFFCCAA, 1.2, 15);
            if (vl) vl.parentMesh = this.mesh;
        }
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
 * Porch House: Cozy siding with a covered porch, planters, mailbox, and a spinning weather vane.
 */
export class HousePorchEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'house_porch';
        this.weatherVane = null;
    }

    static get displayName() { return 'House Porch'; }

    createMesh(params) {
        const group = new THREE.Group();
        const w = params.width || 11;
        const h = params.height || 6;
        const d = params.depth || 9;

        this.params.width = w;
        this.params.height = h;
        this.params.depth = d;

        const sidingPalette = ['#c9d4d2', '#d7c2b2', '#c7c0d3', '#d9d1b0'];
        const sidingColor = sidingPalette[Math.floor(Math.random() * sidingPalette.length)];
        const sidingTex = TextureGenerator.createBuildingFacade({
            color: sidingColor,
            windowColor: '#1b2f3a',
            floors: 2,
            cols: 3,
            width: 256,
            height: 256
        });
        const sidingMat = new THREE.MeshStandardMaterial({ map: sidingTex, color: 0xffffff });

        const body = new THREE.Mesh(boxGeo, sidingMat);
        body.scale.set(w, h, d);
        body.position.set(0, h / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const roofH = h * 0.7;
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b3a40 });
        const roof = new THREE.Mesh(coneGeo, roofMat);
        roof.scale.set(w * 0.95, roofH, d * 0.95);
        roof.position.set(0, h + roofH / 2, 0);
        roof.castShadow = true;
        group.add(roof);

        const porchDepth = d * 0.5;
        const porchMat = new THREE.MeshStandardMaterial({ color: 0x9e8f7b });
        const porch = new THREE.Mesh(boxGeo, porchMat);
        porch.scale.set(w * 0.65, 0.4, porchDepth);
        porch.position.set(0, 0.2, d / 2 + porchDepth / 2 - 0.2);
        porch.receiveShadow = true;
        group.add(porch);

        const stepMat = new THREE.MeshStandardMaterial({ color: 0x7a6b5c });
        const step1 = new THREE.Mesh(boxGeo, stepMat);
        step1.scale.set(w * 0.4, 0.2, porchDepth * 0.4);
        step1.position.set(0, 0.1, d / 2 + porchDepth * 0.9);
        group.add(step1);

        const step2 = new THREE.Mesh(boxGeo, stepMat);
        step2.scale.set(w * 0.25, 0.15, porchDepth * 0.25);
        step2.position.set(0, 0.05, d / 2 + porchDepth * 1.15);
        group.add(step2);

        const awningMat = new THREE.MeshStandardMaterial({ color: 0x66594e });
        const awning = new THREE.Mesh(boxGeo, awningMat);
        const awningHeight = h * 0.45;
        awning.scale.set(w * 0.7, 0.25, porchDepth * 0.95);
        awning.position.set(0, awningHeight, d / 2 + porchDepth / 2 - 0.2);
        group.add(awning);

        const postGeo = new THREE.CylinderGeometry(0.18, 0.2, awningHeight, 8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0xf0ede6 });
        const postOffsets = [
            [-w * 0.3, awningHeight / 2, d / 2 + porchDepth * 0.1],
            [w * 0.3, awningHeight / 2, d / 2 + porchDepth * 0.1],
            [-w * 0.3, awningHeight / 2, d / 2 + porchDepth * 0.7],
            [w * 0.3, awningHeight / 2, d / 2 + porchDepth * 0.7]
        ];
        postOffsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x, y, z);
            post.castShadow = true;
            group.add(post);
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x8cb6d9,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x112233,
            emissiveIntensity: 0.4
        });
        const window1 = new THREE.Mesh(boxGeo, glassMat);
        window1.scale.set(0.2, h * 0.35, d * 0.35);
        window1.position.set(-w * 0.25, h * 0.55, 0);
        group.add(window1);

        const window2 = window1.clone();
        window2.position.set(w * 0.25, h * 0.55, 0);
        group.add(window2);

        const doorMat = new THREE.MeshStandardMaterial({ color: 0x3f2e2a });
        const door = new THREE.Mesh(boxGeo, doorMat);
        door.scale.set(1.6, 2.6, 0.2);
        door.position.set(0, 1.3, d / 2 + 0.1);
        group.add(door);

        const mailboxMat = new THREE.MeshStandardMaterial({ color: 0x39516d });
        const mailboxPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), postMat);
        mailboxPost.position.set(-w * 0.55, 0.8, d / 2 + porchDepth + 0.4);
        group.add(mailboxPost);

        const mailbox = new THREE.Mesh(boxGeo, mailboxMat);
        mailbox.scale.set(1.1, 0.6, 0.7);
        mailbox.position.set(-w * 0.55, 1.4, d / 2 + porchDepth + 0.4);
        group.add(mailbox);

        const planterMat = new THREE.MeshStandardMaterial({ color: 0x6b4b3a });
        const planter = new THREE.Mesh(boxGeo, planterMat);
        planter.scale.set(1.8, 0.6, 0.8);
        planter.position.set(-w * 0.25, 0.3, d / 2 + porchDepth * 0.75);
        group.add(planter);

        const planter2 = planter.clone();
        planter2.position.set(w * 0.25, 0.3, d / 2 + porchDepth * 0.75);
        group.add(planter2);

        const flowerGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const flowerColors = [0xf2c94c, 0xeb5757, 0x27ae60, 0x2d9cdb];
        for (let i = 0; i < 6; i++) {
            const flowerMat = new THREE.MeshStandardMaterial({
                color: flowerColors[i % flowerColors.length],
                emissive: 0x111111,
                emissiveIntensity: 0.2
            });
            const flower = new THREE.Mesh(flowerGeo, flowerMat);
            const side = i % 2 === 0 ? -1 : 1;
            const planterOffset = i < 3 ? -w * 0.25 : w * 0.25;
            flower.position.set(planterOffset + side * 0.35, 0.8, d / 2 + porchDepth * 0.8 - (i % 3) * 0.2);
            group.add(flower);
        }

        const acMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ac });
        const acUnit = new THREE.Mesh(boxGeo, acMat);
        acUnit.scale.set(1.6, 1, 1);
        acUnit.position.set(w / 2 + 0.9, h * 0.35, -d * 0.1);
        group.add(acUnit);

        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x4a4f54 }));
        fan.rotation.x = Math.PI / 2;
        fan.position.set(w / 2 + 1.25, h * 0.35, -d * 0.1);
        group.add(fan);

        const vaneGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x7c7f85 }));
        pole.position.set(0, 0.7, 0);
        vaneGroup.add(pole);

        const arrow = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0xc5c9d1 }));
        arrow.scale.set(1.6, 0.12, 0.25);
        arrow.position.set(0.9, 1.2, 0);
        vaneGroup.add(arrow);

        const tail = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x9aa0aa }));
        tail.scale.set(0.4, 0.2, 0.8);
        tail.position.set(-0.7, 1.2, 0);
        vaneGroup.add(tail);

        vaneGroup.position.set(0, h + roofH + 0.2, 0);
        group.add(vaneGroup);
        this.weatherVane = vaneGroup;

        return group;
    }

    update(dt) {
        if (this.weatherVane) {
            this.weatherVane.rotation.y += dt * 0.6;
        }
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

    postInit() {
        if (window.app?.world?.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            // Light under canopy
            const localPos = new THREE.Vector3(0, 2.5, this.params.depth / 2 + 1.5);
            const worldPos = localPos.applyMatrix4(this.mesh.matrixWorld);
            // Cool White (0xDDEEFF)
            const vl = window.app.world.lightSystem.register(worldPos, 0xDDEEFF, 1.2, 20);
            if (vl) vl.parentMesh = this.mesh;
        }
    }
}

// Register all
EntityRegistry.register('house_modern', HouseModernEntity);
EntityRegistry.register('house_cottage', HouseCottageEntity);
EntityRegistry.register('house_porch', HousePorchEntity);
EntityRegistry.register('apartment_block', ApartmentBlockEntity);
