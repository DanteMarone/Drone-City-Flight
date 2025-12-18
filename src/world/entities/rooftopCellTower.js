import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RooftopCellTowerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'rooftopCellTower';
        this.elapsed = Math.random() * 10;
        this.lightHandle = null;
        this.beaconMesh = null;
    }

    static get displayName() { return 'Rooftop Cell Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Dimensions
        const poleHeight = params.height || 4.5;
        const spread = 1.0; // Tripod base spread

        // Materials
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.4,
            metalness: 0.6
        });

        const panelMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.1
        });

        const mountMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });

        const cableMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9
        });

        // 1. Concrete Base Slab
        // We use TextureGenerator for the concrete base as per Forge's Philosophy
        const baseSize = 1.8;
        const baseGeo = new THREE.BoxGeometry(baseSize, 0.2, baseSize);
        const concreteMap = TextureGenerator.createConcrete({ scale: 2 });
        const baseMat = new THREE.MeshStandardMaterial({
            map: concreteMap,
            roughness: 0.9,
            color: 0xaaaaaa
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Tripod Legs
        const legHeight = 2.0;
        const legGeo = new THREE.CylinderGeometry(0.06, 0.06, Math.sqrt(legHeight*legHeight + spread*spread), 8);
        legGeo.translate(0, legGeo.parameters.height/2, 0); // Pivot at bottom

        const legAngle = Math.atan2(spread, legHeight);

        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const leg = new THREE.Mesh(legGeo, steelMat);

            // Position at spread circle
            const x = Math.cos(angle) * spread * 0.6;
            const z = Math.sin(angle) * spread * 0.6;
            leg.position.set(x, 0.2, z);

            // Look at center point at legHeight
            leg.lookAt(0, 0.2 + legHeight, 0);
            // Fix rotation offset from lookAt (Cylinder points up Y)
            leg.rotateX(-Math.PI / 2);

            leg.castShadow = true;
            group.add(leg);
        }

        // 3. Central Pole
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, poleHeight, 12);
        const pole = new THREE.Mesh(poleGeo, steelMat);
        pole.position.y = 0.2 + poleHeight / 2; // Sit on base
        pole.castShadow = true;
        group.add(pole);

        // 4. Antenna Mount Brackets
        const bracketHeight = poleHeight * 0.8 + 0.2;
        const ringGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12);
        const ring = new THREE.Mesh(ringGeo, mountMat);
        ring.position.y = bracketHeight;
        group.add(ring);

        const armGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        for(let i=0; i<3; i++) {
            const angle = (i/3) * Math.PI * 2;
            const arm = new THREE.Mesh(armGeo, mountMat);
            arm.position.y = bracketHeight;
            arm.rotation.y = angle;
            arm.translateZ(0.4); // Push out
            arm.castShadow = true;
            group.add(arm);

            // 5. Sector Antennas (The white panels)
            const panelGeo = new THREE.BoxGeometry(0.3, 1.2, 0.1);
            const panel = new THREE.Mesh(panelGeo, panelMat);

            // Attach to end of arm
            // We need to calculate world pos or just duplicate transforms
            // Easier to add to arm? No, scaling issues.
            // Just compute pos
            const px = Math.sin(angle) * 0.8;
            const pz = Math.cos(angle) * 0.8;

            panel.position.set(px, bracketHeight, pz);
            panel.rotation.y = angle;
            panel.lookAt(px * 2, bracketHeight, pz * 2); // Face outward

            panel.castShadow = true;
            group.add(panel);

            // Cables running down
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, bracketHeight, 6), cableMat);
            cable.position.set(px * 0.2, bracketHeight / 2, pz * 0.2);
            group.add(cable);
        }

        // 6. Microwave Dish (Small backhaul)
        const dishGeo = new THREE.ConeGeometry(0.4, 0.2, 16);
        const dish = new THREE.Mesh(dishGeo, panelMat);
        dish.geometry.rotateX(Math.PI/2); // Face front
        dish.position.set(0, bracketHeight - 0.8, 0.15);
        dish.rotation.y = Math.random() * Math.PI * 2; // Random direction
        dish.translateZ(0.2);
        dish.castShadow = true;
        group.add(dish);

        // 7. Beacon
        const beaconY = 0.2 + poleHeight;
        const beaconGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        this.beaconMesh.position.y = beaconY;
        group.add(this.beaconMesh);

        // 8. Register Virtual Light
        if (params.lightSystem) {
            this.lightHandle = params.lightSystem.register({
                position: new THREE.Vector3(0, beaconY, 0),
                color: 0xff0000,
                intensity: 0,
                range: 20,
                parentMesh: group // Auto-transform with entity
            });
        }

        return group;
    }

    update(dt) {
        this.elapsed += dt;

        // Slow blink: 1s ON, 1s OFF
        const blinkPhase = Math.sin(this.elapsed * 3.0);
        const isGlowing = blinkPhase > 0.5;

        if (this.beaconMesh) {
            this.beaconMesh.visible = isGlowing;
            // Boost emissive appearance when "on" by toggling material color slightly?
            // BasicMaterial is unlit, so it's always bright. Visibility toggle is enough.
        }

        if (this.lightHandle) {
            // Smooth intensity transition or hard toggle?
            // Hard toggle fits a beacon better.
            this.lightHandle.intensity = isGlowing ? 1.5 : 0.0;
        }
    }
}

EntityRegistry.register('rooftopCellTower', RooftopCellTowerEntity);
