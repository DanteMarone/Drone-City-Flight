import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class HVACEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'hvac';
        this.fanSpeed = 5.0 + Math.random() * 5.0;
    }

    static get displayName() { return 'Industrial HVAC'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Housing Box
        const housingGeo = new THREE.BoxGeometry(3, 2, 3);
        const housingMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.6,
            metalness: 0.4
        });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.y = 1;
        housing.castShadow = true;
        housing.receiveShadow = true;
        group.add(housing);

        // 2. Fan Recess (Top)
        const recessGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const recess = new THREE.Mesh(recessGeo, darkMat);
        recess.position.y = 2.01;
        group.add(recess);

        // 3. Fan Blades
        this.fanGroup = new THREE.Group();
        this.fanGroup.position.y = 2.05;
        group.add(this.fanGroup);

        const bladeGeo = new THREE.BoxGeometry(0.2, 0.05, 1.1);
        bladeGeo.translate(0, 0, 0.6); // Pivot at end

        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(bladeGeo, housingMat);
            blade.rotation.y = (i * Math.PI) / 2;
            this.fanGroup.add(blade);
        }

        // 4. Grille
        const grilleGroup = new THREE.Group();
        grilleGroup.position.y = 2.15;

        const barGeo = new THREE.BoxGeometry(2.4, 0.05, 0.05);
        for (let i = -2; i <= 2; i++) {
            const bar = new THREE.Mesh(barGeo, housingMat);
            bar.position.z = i * 0.4;
            grilleGroup.add(bar);
        }
        // Cross bar
        const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.4), housingMat);
        grilleGroup.add(crossBar);

        group.add(grilleGroup);

        // 5. Vents (Side)
        const ventGeo = new THREE.BoxGeometry(2.5, 0.8, 0.1);
        const ventMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const vent1 = new THREE.Mesh(ventGeo, ventMat);
        vent1.position.set(0, 1, 1.51);
        group.add(vent1);

        return group;
    }

    update(dt) {
        if (this.fanGroup) {
            this.fanGroup.rotation.y -= this.fanSpeed * dt;
        }
    }
}

EntityRegistry.register('hvac', HVACEntity);
