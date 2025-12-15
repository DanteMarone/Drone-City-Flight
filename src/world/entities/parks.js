import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

class ParkEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.width = 20;
        this.depth = 20;
    }

    createGround(texture, color = 0xffffff) {
        const geometry = new THREE.PlaneGeometry(this.width, this.depth);
        if (texture) {
            texture.repeat.set(this.width / 4, this.depth / 4);
        }
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            color: color,
            roughness: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        return mesh;
    }

    // Default box collider for the ground area
    createCollider() {
        if (!this.mesh) return null;
        this.mesh.updateMatrixWorld(true);
        // Create a box that covers the footprint but has some height
        const box = new THREE.Box3();
        // Since the mesh origin is center bottom usually, but plane is at 0...
        // We will compute from mesh.
        box.setFromObject(this.mesh);

        // Ensure the box has some height for physics if it's just a plane
        if (box.max.y - box.min.y < 0.1) {
            box.max.y += 0.5;
        }
        return box;
    }
}

// -----------------------------------------------------------------------------
// Small Nature Park
// -----------------------------------------------------------------------------
export class ParkNatureSmall extends ParkEntity {
    constructor(params) {
        super(params);
        this.type = 'park_nature_small';
        this.width = 20;
        this.depth = 20;
    }

    static get displayName() { return 'Park (Nature, Small)'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Ground
        const ground = this.createGround(TextureGenerator.createGrass());
        group.add(ground);

        // Trees
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.8 });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.9 });

        // Fixed positions for deterministic layout
        const treePositions = [
            { x: -5, z: -6 },
            { x: 7, z: 7 },
            { x: -7, z: 6 },
            { x: 6, z: -5 },
            { x: 0, z: -8 }
        ];

        treePositions.forEach(pos => {
            const tree = new THREE.Group();

            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6), trunkMat);
            trunk.position.y = 0.75;
            trunk.castShadow = true;
            tree.add(trunk);

            const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 7), treeMat);
            foliage.position.y = 2.5;
            foliage.castShadow = true;
            tree.add(foliage);

            tree.position.set(pos.x, 0, pos.z);
            group.add(tree);
        });

        // Benches
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

        const benchConfigs = [
            { x: 3, z: 3, ry: Math.PI / 4 },
            { x: -3, z: -3, ry: -Math.PI / 4 }
        ];

        benchConfigs.forEach(cfg => {
            const bench = new THREE.Group();
            const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.6), benchMat);
            seat.position.y = 0.5;
            seat.castShadow = true;
            bench.add(seat);

            const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.5), benchMat);
            leg1.position.set(-0.8, 0.25, 0);
            bench.add(leg1);

            const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.5), benchMat);
            leg2.position.set(0.8, 0.25, 0);
            bench.add(leg2);

            bench.position.set(cfg.x, 0, cfg.z);
            bench.rotation.y = cfg.ry;

            group.add(bench);
        });

        return group;
    }
}

// -----------------------------------------------------------------------------
// Small Playset Park
// -----------------------------------------------------------------------------
export class ParkPlaysetSmall extends ParkEntity {
    constructor(params) {
        super(params);
        this.type = 'park_playset_small';
        this.width = 20;
        this.depth = 20;
    }

    static get displayName() { return 'Park (Playset, Small)'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Ground - Sand
        const ground = this.createGround(TextureGenerator.createSand());
        group.add(ground);

        // Border
        const borderGeo = new THREE.BoxGeometry(20, 0.2, 0.5);
        const borderMat = new THREE.MeshStandardMaterial({ color: 0x885533 });
        const b1 = new THREE.Mesh(borderGeo, borderMat); b1.position.z = 9.75; b1.position.y = 0.1;
        const b2 = new THREE.Mesh(borderGeo, borderMat); b2.position.z = -9.75; b2.position.y = 0.1;
        const b3 = new THREE.Mesh(borderGeo, borderMat); b3.rotation.y = Math.PI/2; b3.position.x = 9.75; b3.position.y = 0.1;
        const b4 = new THREE.Mesh(borderGeo, borderMat); b4.rotation.y = Math.PI/2; b4.position.x = -9.75; b4.position.y = 0.1;
        group.add(b1, b2, b3, b4);

        // Swingset
        const swingGroup = new THREE.Group();
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, metalness: 0.5, roughness: 0.2 });

        // A-Frame legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
        const l1 = new THREE.Mesh(legGeo, poleMat); l1.position.set(-2, 2, 1.5); l1.rotation.x = 0.3;
        const l2 = new THREE.Mesh(legGeo, poleMat); l2.position.set(-2, 2, -1.5); l2.rotation.x = -0.3;
        const l3 = new THREE.Mesh(legGeo, poleMat); l3.position.set(2, 2, 1.5); l3.rotation.x = 0.3;
        const l4 = new THREE.Mesh(legGeo, poleMat); l4.position.set(2, 2, -1.5); l4.rotation.x = -0.3;
        // Top bar
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), poleMat);
        bar.rotation.z = Math.PI/2;
        bar.position.y = 3.8;

        swingGroup.add(l1, l2, l3, l4, bar);

        // Seats
        const ropeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const seatMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        [-1, 1].forEach(xOff => {
            const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5), ropeMat);
            ropeL.position.set(xOff - 0.3, 2.5, 0);

            const ropeR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5), ropeMat);
            ropeR.position.set(xOff + 0.3, 2.5, 0);

            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), seatMat);
            seat.position.set(xOff, 1.3, 0);

            swingGroup.add(ropeL, ropeR, seat);
        });

        swingGroup.position.set(-4, 0, -4);
        swingGroup.rotation.y = Math.PI / 4;
        group.add(swingGroup);

        // Slide
        const slideGroup = new THREE.Group();
        const ladderGeo = new THREE.BoxGeometry(0.8, 3, 0.1);
        const ladder = new THREE.Mesh(ladderGeo, poleMat);
        ladder.position.y = 1.5;
        ladder.rotation.x = -0.2;

        const platform = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), poleMat);
        platform.position.set(0, 2.9, 0.5);

        const rampGeo = new THREE.BoxGeometry(1, 4, 0.1);
        const ramp = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ color: 0xffff00 }));
        ramp.position.set(0, 1.5, 2.5);
        ramp.rotation.x = -Math.PI/3;

        slideGroup.add(ladder, platform, ramp);
        slideGroup.position.set(4, 0, 4);
        slideGroup.rotation.y = -Math.PI / 3;
        group.add(slideGroup);

        return group;
    }
}

// -----------------------------------------------------------------------------
// Large Skate Park
// -----------------------------------------------------------------------------
export class ParkSkateLarge extends ParkEntity {
    constructor(params) {
        super(params);
        this.type = 'park_skate_large';
        this.width = 40;
        this.depth = 40;
    }

    static get displayName() { return 'Park (Skate, Large)'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Concrete Ground
        const ground = this.createGround(TextureGenerator.createConcrete());
        group.add(ground);

        const concreteMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });

        // Half-pipe (Simulated with planes/ramps)
        const halfPipe = new THREE.Group();
        const rampL = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 8), concreteMat);
        rampL.position.set(-4, 1, 0);
        rampL.rotation.z = -Math.PI / 6;

        const rampR = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 8), concreteMat);
        rampR.position.set(4, 1, 0);
        rampR.rotation.z = Math.PI / 6;

        const flat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 8), concreteMat);
        flat.position.y = 0.25;

        halfPipe.add(rampL, rampR, flat);
        halfPipe.position.set(-10, 0, -10);
        group.add(halfPipe);

        // Grind Rail
        const railGroup = new THREE.Group();
        const railBar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), railMat);
        railBar.rotation.z = Math.PI / 2;
        railBar.position.y = 0.8;

        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), railMat);
        leg1.position.set(-3, 0.4, 0);
        const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), railMat);
        leg2.position.set(3, 0.4, 0);

        railGroup.add(railBar, leg1, leg2);
        railGroup.position.set(10, 0, 10);
        railGroup.rotation.y = Math.PI / 4;
        group.add(railGroup);

        // Funbox / Pyramid
        const funbox = new THREE.Mesh(new THREE.ConeGeometry(6, 2, 4), concreteMat);
        funbox.rotation.y = Math.PI / 4;
        funbox.position.set(5, 1, -5);
        funbox.castShadow = true;
        group.add(funbox);

        return group;
    }
}

// -----------------------------------------------------------------------------
// Large Water Park (Splash Pad)
// -----------------------------------------------------------------------------
export class ParkWaterLarge extends ParkEntity {
    constructor(params) {
        super(params);
        this.type = 'park_water_large';
        this.width = 40;
        this.depth = 40;
    }

    static get displayName() { return 'Park (Water, Large)'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Tiled Ground (Concrete base)
        const ground = this.createGround(TextureGenerator.createConcrete(), 0xdddddd);
        group.add(ground);

        // Central Splash Pad (Blue recessed area)
        const waterGeo = new THREE.CircleGeometry(12, 32);
        const waterMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createWater(),
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.1
        });
        const pool = new THREE.Mesh(waterGeo, waterMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.y = 0.05; // Slightly above ground
        group.add(pool);

        // Fountain (Center)
        const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 1, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        fountainBase.position.y = 0.5;
        group.add(fountainBase);

        const fountainSpout = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x88ccff }));
        fountainSpout.position.y = 1.5;
        group.add(fountainSpout);

        // Sprinklers (Arches)
        const tubeGeo = new THREE.TorusGeometry(3, 0.2, 8, 16, Math.PI);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        for (let i = 0; i < 3; i++) {
            const arch = new THREE.Mesh(tubeGeo, tubeMat);
            const angle = (i / 3) * Math.PI * 2;
            const dist = 8;
            arch.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

            // Orient arch to face center
            arch.lookAt(0, 0, 0);

            group.add(arch);
        }

        // Fake Water Particles (Static for now, maybe animated in update)
        // Just small spheres to look like spray
        const sprayGeo = new THREE.SphereGeometry(0.1, 4, 4);
        const sprayMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

        // Use a fixed seed-like pattern for particles to minimize randomness appearance
        for(let i=0; i<20; i++) {
            const drop = new THREE.Mesh(sprayGeo, sprayMat);
            const angle = (i / 20) * Math.PI * 4; // Spiral
            const r = (i / 20) * 3;
            drop.position.set(
                Math.cos(angle) * r,
                2 + (i % 3),
                Math.sin(angle) * r
            );
            group.add(drop);
        }

        return group;
    }
}

// Register all
EntityRegistry.register('park_nature_small', ParkNatureSmall);
EntityRegistry.register('park_playset_small', ParkPlaysetSmall);
EntityRegistry.register('park_skate_large', ParkSkateLarge);
EntityRegistry.register('park_water_large', ParkWaterLarge);
