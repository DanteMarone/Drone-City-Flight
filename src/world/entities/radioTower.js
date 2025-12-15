import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class RadioTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'radioTower';
        this.elapsed = 0;
        this.rotationSpeed = 0.5 + Math.random() * 0.5;
    }

    static get displayName() { return 'Radio Tower'; }

    createMesh(params) {
        const height = params.height || 35;
        this.params.height = height;

        const group = new THREE.Group();

        // Materials
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x888899,
            roughness: 0.7,
            metalness: 0.4,
            flatShading: true
        });

        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9
        });

        const dishMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.3,
            metalness: 0.2
        });

        const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // 1. Base Foundation
        const baseGeo = new THREE.BoxGeometry(4, 2, 4);
        baseGeo.translate(0, 1, 0);
        const base = new THREE.Mesh(baseGeo, concreteMat);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Main Mast (Tapered)
        const mastGeo = new THREE.CylinderGeometry(0.5, 1.5, height, 8);
        mastGeo.translate(0, height / 2 + 2, 0);
        const mast = new THREE.Mesh(mastGeo, steelMat);
        mast.castShadow = true;
        mast.receiveShadow = true;
        group.add(mast);

        // 3. Platforms
        const platGeo = new THREE.CylinderGeometry(2, 2, 0.2, 8);
        const plat1 = new THREE.Mesh(platGeo, steelMat);
        plat1.position.y = height * 0.6;
        mast.add(plat1); // Attach to mast

        const plat2 = new THREE.Mesh(platGeo, steelMat);
        plat2.position.y = height * 0.9;
        mast.add(plat2);

        // 4. Rotating Dishes Group
        this.dishGroup = new THREE.Group();
        this.dishGroup.position.y = height * 0.9 + 1;
        group.add(this.dishGroup);

        // Dish 1
        const dishGeo = new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, 0.5);
        const dish1 = new THREE.Mesh(dishGeo, dishMat);
        dish1.position.set(0, 0, 0.5);
        dish1.rotation.x = -Math.PI / 2;
        dish1.scale.set(1, 1, 0.4); // Flatten
        this.dishGroup.add(dish1);

        // Dish 2 (Smaller, offset)
        const dish2 = new THREE.Mesh(dishGeo, dishMat);
        dish2.scale.set(0.6, 0.6, 0.3);
        dish2.position.set(0, 1.5, -0.5);
        dish2.rotation.x = -Math.PI / 2 + 0.4;
        this.dishGroup.add(dish2);

        // 5. Beacon
        const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
        this.beacon = new THREE.Mesh(beaconGeo, redLightMat);
        this.beacon.position.set(0, height + 2.5, 0);
        group.add(this.beacon);

        // Collision Box (Simplified to mast height)
        // Physics system handles box from bounds, but we can hint if needed.
        // Default bounding box calculation will cover the whole group.

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.elapsed += dt;

        // Rotate dishes
        if (this.dishGroup) {
            this.dishGroup.rotation.y += this.rotationSpeed * dt;
        }

        // Blink light
        if (this.beacon) {
            const blink = Math.sin(this.elapsed * 5) > 0;
            this.beacon.visible = blink;
        }
    }
}

EntityRegistry.register('radioTower', RadioTowerEntity);
