import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class RadarDishEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'radarDish';
        this.azimuthSpeed = params.azimuthSpeed || 0.5;
        this.elevationSpeed = params.elevationSpeed || 0.2;
        this.time = Math.random() * 100;
    }

    static get displayName() { return 'Radar Dish'; }

    createMesh(params) {
        const height = params.height || 12;
        const dishSize = params.dishSize || 8;

        this.params.height = height;
        this.params.dishSize = dishSize;

        const group = new THREE.Group();

        // Materials
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x556677,
            roughness: 0.6,
            metalness: 0.4
        });

        const dishMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.4,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // 1. Base Pedestal
        const baseHeight = height * 0.4;
        const baseGeo = new THREE.CylinderGeometry(2, 3, baseHeight, 8);
        const base = new THREE.Mesh(baseGeo, concreteMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Turret (Rotates on Y)
        this.turret = new THREE.Group();
        this.turret.position.y = baseHeight;
        group.add(this.turret);

        // Turret Body
        const turretGeo = new THREE.BoxGeometry(4, 2, 3);
        const turretMesh = new THREE.Mesh(turretGeo, metalMat);
        turretMesh.position.y = 1;
        turretMesh.castShadow = true;
        turretMesh.receiveShadow = true;
        this.turret.add(turretMesh);

        // Yoke Arms
        const armGeo = new THREE.BoxGeometry(1, 4, 2);
        const leftArm = new THREE.Mesh(armGeo, metalMat);
        leftArm.position.set(-2, 3, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;

        const rightArm = new THREE.Mesh(armGeo, metalMat);
        rightArm.position.set(2, 3, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;

        this.turret.add(leftArm);
        this.turret.add(rightArm);

        // 3. Dish Assembly (Rotates on X for elevation)
        this.dishPivot = new THREE.Group();
        this.dishPivot.position.set(0, 4, 0); // Pivot point between arms
        this.turret.add(this.dishPivot);

        // The Dish
        // Use a Sphere cut in half (hemisphere) then scaled to look parabolic
        // phiStart=0, phiLength=PI*2, thetaStart=0, thetaLength=PI/3
        const dishGeo = new THREE.SphereGeometry(dishSize / 2, 32, 16, 0, Math.PI * 2, 0, 0.8);
        // Flatten it slightly
        dishGeo.scale(1, 1, 0.4);

        const dish = new THREE.Mesh(dishGeo, dishMat);
        // Rotate so the "bowl" faces forward (Z)
        // Sphere default pole is Y. 0.8 theta is top cap.
        dish.rotation.x = -Math.PI / 2;
        dish.position.set(0, 0, 0.5); // Offset slightly
        dish.castShadow = true;
        dish.receiveShadow = true;
        this.dishPivot.add(dish);

        // Feed Horn (Antenna in center)
        const feedArmGeo = new THREE.CylinderGeometry(0.2, 0.2, dishSize * 0.4, 8);
        feedArmGeo.rotateX(Math.PI / 2);
        const feedArm = new THREE.Mesh(feedArmGeo, metalMat);
        feedArm.position.z = dishSize * 0.2;
        this.dishPivot.add(feedArm);

        const feedTipGeo = new THREE.ConeGeometry(0.5, 0.8, 8);
        feedTipGeo.rotateX(-Math.PI / 2); // Point back at dish
        const feedTip = new THREE.Mesh(feedTipGeo, metalMat);
        feedTip.position.z = dishSize * 0.4;
        this.dishPivot.add(feedTip);

        // Counterweight (Back of dish)
        const weightGeo = new THREE.BoxGeometry(3, 1, 2);
        const weight = new THREE.Mesh(weightGeo, metalMat);
        weight.position.set(0, 0, -1);
        this.dishPivot.add(weight);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.time += dt;

        // Azimuth Rotation (Scanning 360)
        if (this.turret) {
            this.turret.rotation.y -= this.azimuthSpeed * dt;
        }

        // Elevation Wobble (Scanning up/down)
        if (this.dishPivot) {
            // Sine wave between -0.2 and 0.5 radians
            const elev = Math.sin(this.time * this.elevationSpeed) * 0.3 + 0.2;
            this.dishPivot.rotation.x = -elev;
        }
    }
}

EntityRegistry.register('radarDish', RadarDishEntity);
