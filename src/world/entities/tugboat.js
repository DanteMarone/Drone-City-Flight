import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { CONFIG } from '../../config.js';

export class TugboatEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'tugboat';
        // Slower than cars, consistent with a heavy boat
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) * 0.3;
        this._time = Math.random() * 100; // Random offset for bobbing
        this._bobbingGroup = null;
    }

    static get displayName() { return 'Tugboat'; }

    createMesh(params) {
        // VehicleEntity expects a 'modelGroup' that it moves/rotates
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        // We add a child group for local animations (bobbing)
        // so they don't interfere with the parent's path following
        this._bobbingGroup = new THREE.Group();
        modelGroup.add(this._bobbingGroup);

        const hullColor = 0xa33e3e; // Oxide Red
        const deckColor = 0x6e6e6e; // Dark Grey
        const cabinColor = 0xffffff; // White
        const chimneyColor = 0x333333; // Dark Grey/Black

        // Materials
        const hullMat = new THREE.MeshStandardMaterial({ color: hullColor, roughness: 0.7 });
        const deckMat = new THREE.MeshStandardMaterial({ color: deckColor, roughness: 0.8 });
        const cabinMat = new THREE.MeshStandardMaterial({ color: cabinColor, roughness: 0.4 });
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
        const chimneyMat = new THREE.MeshStandardMaterial({ color: chimneyColor, roughness: 0.9 });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

        // --- HULL ---
        // Main block
        const hullGeo = new THREE.BoxGeometry(1.6, 1.2, 2.8);
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 0.6; // Sit on water surface (Y=0)
        hull.castShadow = true;
        hull.receiveShadow = true;
        this._bobbingGroup.add(hull);

        // Bow (Pointy front) - Cone facing +Z
        const bowGeo = new THREE.ConeGeometry(1.1, 1.5, 4); // 4 sides = pyramid-ish
        const bow = new THREE.Mesh(bowGeo, hullMat);
        bow.rotation.x = Math.PI / 2; // Point Z
        bow.rotation.y = Math.PI / 4; // Flat sides
        bow.position.set(0, 0.6, 1.4 + 0.75); // 1.4 is half hull length
        bow.castShadow = true;
        bow.receiveShadow = true;
        this._bobbingGroup.add(bow);

        // Deck
        const deckGeo = new THREE.BoxGeometry(1.5, 0.1, 2.7);
        const deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(0, 1.21, 0);
        deck.receiveShadow = true;
        this._bobbingGroup.add(deck);

        // Deck (Bow section)
        const bowDeckGeo = new THREE.ConeGeometry(1.0, 1.4, 4);
        const bowDeck = new THREE.Mesh(bowDeckGeo, deckMat);
        bowDeck.rotation.x = Math.PI / 2;
        bowDeck.rotation.y = Math.PI / 4;
        bowDeck.position.set(0, 1.21, 1.4 + 0.7);
        bowDeck.scale.set(0.95, 0.95, 0.95); // Slightly smaller than hull bow
        this._bobbingGroup.add(bowDeck);


        // --- CABIN ---
        const cabinGeo = new THREE.BoxGeometry(1.2, 0.9, 1.4);
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.2 + 0.45, -0.2);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        this._bobbingGroup.add(cabin);

        // Pilot House (Upper cabin)
        const pilotGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const pilot = new THREE.Mesh(pilotGeo, cabinMat);
        pilot.position.set(0, 1.2 + 0.9 + 0.3, -0.1);
        pilot.castShadow = true;
        pilot.receiveShadow = true;
        this._bobbingGroup.add(pilot);

        // Windows (Pilot House)
        const winGeo = new THREE.BoxGeometry(0.82, 0.3, 0.82);
        const win = new THREE.Mesh(winGeo, windowMat);
        win.position.copy(pilot.position);
        win.position.y += 0.05;
        this._bobbingGroup.add(win);


        // --- CHIMNEY ---
        const stackGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
        const stack = new THREE.Mesh(stackGeo, chimneyMat);
        stack.position.set(0, 1.2 + 0.9 + 1.0, -0.6);
        stack.rotation.x = -0.1; // Lean back
        stack.castShadow = true;
        stack.receiveShadow = true;
        this._bobbingGroup.add(stack);


        // --- DETAILS ---
        // Tires (Bumpers)
        const tireGeo = new THREE.TorusGeometry(0.25, 0.1, 8, 16);
        const sidePositions = [
            [0.85, 0.8, 0.5], [-0.85, 0.8, 0.5],
            [0.85, 0.8, -0.5], [-0.85, 0.8, -0.5],
            [0.85, 0.8, -1.2], [-0.85, 0.8, -1.2]
        ];

        sidePositions.forEach(pos => {
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.position.set(...pos);
            tire.rotation.y = Math.PI / 2;
            tire.castShadow = true;
            this._bobbingGroup.add(tire);
        });

        // Life Ring on back of cabin
        const ringGeo = new THREE.TorusGeometry(0.2, 0.06, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4400 }); // Safety Orange
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 1.2 + 0.5, -0.92); // Back of main cabin
        ring.castShadow = true;
        this._bobbingGroup.add(ring);


        // Root Group
        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }

    update(dt) {
        // Standard vehicle movement (path following)
        super.update(dt);

        // Add bobbing animation
        if (this._bobbingGroup) {
            this._time += dt;

            // Vertical bob
            const yOffset = Math.sin(this._time * 1.5) * 0.05;
            this._bobbingGroup.position.y = yOffset;

            // Pitch (rocking front/back)
            this._bobbingGroup.rotation.x = Math.cos(this._time * 1.0) * 0.02;

            // Roll (rocking side/side)
            this._bobbingGroup.rotation.z = Math.sin(this._time * 0.8) * 0.03;
        }
    }
}

EntityRegistry.register('tugboat', TugboatEntity);
