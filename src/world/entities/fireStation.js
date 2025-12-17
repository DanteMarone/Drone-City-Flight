import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';
import { EntityRegistry } from './registry.js';

export class FireStationEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'fire_station';
        this.sirenMesh = null;
    }

    static get displayName() { return 'Fire Station'; }

    createMesh(params) {
        const w = params.width || 18;
        const d = params.depth || 14;
        const h = params.height || 8; // Main garage height

        this.params.width = w;
        this.params.depth = d;
        this.params.height = h;

        const group = new THREE.Group();

        // --- Materials ---
        const brickTex = TextureGenerator.createBrick({
            color: '#a33333', // Fire Engine Red-ish brick
            mortar: '#999999',
            rows: 15,
            cols: 8
        });
        const wallMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.7 });

        const concreteMat = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createConcrete(),
            color: 0xdddddd
        });

        const garageDoorMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x112233,
            emissiveIntensity: 0.2
        });

        // --- 1. Main Garage Block ---
        const garageGeo = new THREE.BoxGeometry(1, 1, 1);
        const garage = new THREE.Mesh(garageGeo, wallMat);
        garage.scale.set(w * 0.65, h, d);
        // Position on the left side
        garage.position.set(-w * 0.15, h / 2, 0);
        garage.castShadow = true;
        garage.receiveShadow = true;
        group.add(garage);

        // --- 2. Garage Doors ---
        const doorW = (w * 0.65) / 2 - 1;
        const doorH = h * 0.7;

        const door1 = new THREE.Mesh(garageGeo, garageDoorMat);
        door1.scale.set(doorW, doorH, 0.5);
        // Front face of garage, slightly recessed
        door1.position.set(-w * 0.15 - doorW/2 - 0.5, doorH/2, d/2);
        group.add(door1);

        const door2 = new THREE.Mesh(garageGeo, garageDoorMat);
        door2.scale.set(doorW, doorH, 0.5);
        door2.position.set(-w * 0.15 + doorW/2 + 0.5, doorH/2, d/2);
        group.add(door2);

        // --- 3. Office/Living Quarters Block ---
        const officeW = w * 0.35;
        const officeH = h * 1.2; // 2 stories
        const office = new THREE.Mesh(garageGeo, concreteMat);
        office.scale.set(officeW, officeH, d * 0.8);
        office.position.set(w * 0.35, officeH / 2, -d * 0.1);
        office.castShadow = true;
        office.receiveShadow = true;
        group.add(office);

        // Windows for office
        const winMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.1 });
        const winGeo = new THREE.BoxGeometry(1, 1, 1);

        // 2 floors of windows
        for (let floor = 0; floor < 2; floor++) {
            const y = (officeH / 4) * (floor === 0 ? 1 : 3);
            const win = new THREE.Mesh(winGeo, winMat);
            win.scale.set(officeW + 0.2, 1.5, 2.5);
            win.position.set(w * 0.35, y, d * 0.3); // Front facing windows
            group.add(win);
        }

        // --- 4. Hose Tower ---
        const towerH = h * 2.5;
        const towerW = 4;
        const tower = new THREE.Mesh(garageGeo, wallMat);
        tower.scale.set(towerW, towerH, towerW);
        tower.position.set(w * 0.35, towerH / 2, -d * 0.4); // Back corner of office
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        // Tower Roof
        const roofGeo = new THREE.ConeGeometry(towerW * 0.8, 3, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(w * 0.35, towerH + 1.5, -d * 0.4);
        group.add(roof);

        // --- 5. Siren / Light ---
        const lightGroup = new THREE.Group();
        lightGroup.position.set(w * 0.35, towerH + 3.5, -d * 0.4); // Top of tower roof

        const baseCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        lightGroup.add(baseCyl);

        const sirenGeo = new THREE.BoxGeometry(0.8, 0.6, 0.2);
        const sirenMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.0,
            toneMapped: false
        });
        const siren = new THREE.Mesh(sirenGeo, sirenMat);
        siren.position.y = 0.5;
        lightGroup.add(siren);

        group.add(lightGroup);
        this.sirenMesh = lightGroup;

        // --- 6. Signage ---
        // "FIRE" sign represented by red cubes? Or just a stripe.
        const signStripe = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.6, 1, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        signStripe.position.set(-w * 0.15, h - 1.5, d/2 + 0.1);
        group.add(signStripe);

        // Text approximation (Red blocks on white stripe)
        // 4 blocks
        const letterMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
        const letterGeo = new THREE.BoxGeometry(0.6, 0.6, 0.3);
        for(let i=0; i<4; i++) {
            const l = new THREE.Mesh(letterGeo, letterMat);
            l.position.set(-w * 0.15 - 3 + i * 2, h - 1.5, d/2 + 0.15);
            group.add(l);
        }

        return group;
    }

    update(dt) {
        if (this.sirenMesh) {
            this.sirenMesh.rotation.y += dt * 5.0; // Fast rotation
        }
    }
}

EntityRegistry.register('fire_station', FireStationEntity);
