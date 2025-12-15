import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WindTurbineEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'windTurbine';
        this.rotationSpeed = params.rotationSpeed || 1.0;
    }

    static get displayName() { return 'Wind Turbine'; }

    createMesh(params) {
        const height = params.height || 40;
        this.params.height = height;
        this.params.rotationSpeed = this.rotationSpeed;

        const group = new THREE.Group();

        // 1. Tower
        const towerGeo = new THREE.CylinderGeometry(1, 2, height, 8);
        const towerMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.6,
            metalness: 0.1
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = height / 2;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        // 2. Nacelle (Housing)
        const nacelleGeo = new THREE.BoxGeometry(3, 3, 6);
        const nacelleMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.4
        });
        const nacelle = new THREE.Mesh(nacelleGeo, nacelleMat);
        nacelle.position.y = height;
        nacelle.castShadow = true;
        group.add(nacelle);

        // 3. Rotor Group
        const rotorGroup = new THREE.Group();
        rotorGroup.name = 'rotor';
        rotorGroup.position.set(0, height, 3); // Front of nacelle
        group.add(rotorGroup);

        // 4. Hub
        const hubGeo = new THREE.ConeGeometry(1.5, 2, 8);
        hubGeo.rotateX(Math.PI / 2); // Point forward
        const hub = new THREE.Mesh(hubGeo, towerMat);
        hub.position.z = 1;
        rotorGroup.add(hub);

        // 5. Blades
        const bladeLen = 15;
        const bladeGeo = new THREE.BoxGeometry(1, bladeLen, 0.5);
        // Pivot adjustment: translate so y=0 is the base
        bladeGeo.translate(0, bladeLen / 2, 0);

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2
        });

        // 3 Blades
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.z = i * (Math.PI * 2 / 3);
            blade.castShadow = true;
            rotorGroup.add(blade);

            // Red tip detail
            const tipGeo = new THREE.BoxGeometry(1.05, 3, 0.55);
            tipGeo.translate(0, bladeLen - 1.5, 0);
            const tipMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.8 });
            const tip = new THREE.Mesh(tipGeo, tipMat);
            // Tip needs same rotation, easier to add as child of blade?
            // Scaling/transforming geometries is better for batching usually, but here hierarchies are fine.
            // Let's just add it to rotor group with same rotation.
            tip.rotation.z = i * (Math.PI * 2 / 3);
            rotorGroup.add(tip);
        }

        // Add a red beacon light on top of nacelle
        const lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const beacon = new THREE.Mesh(lightGeo, lightMat);
        beacon.position.set(0, height + 1.5, -2);
        group.add(beacon);

        return group;
    }

    update(dt) {
        if (this.mesh) {
            const rotor = this.mesh.getObjectByName('rotor');
            if (rotor) {
                rotor.rotation.z -= this.rotationSpeed * dt;
            }
        }
    }

    // Override collider to be static based on swept area, or just the tower?
    // Let's use the default which boxes the whole initial state.
    // The initial state includes blades pointing up/down.
    // It creates a large box. That's safer for physics than a thin tower
    // where you might clip a blade.
}

EntityRegistry.register('windTurbine', WindTurbineEntity);
