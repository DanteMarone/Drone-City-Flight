import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WindTurbineEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'windTurbine';
        this.towerHeight = params?.towerHeight ?? (12 + Math.random() * 6);
        this.bladeSpeed = params?.bladeSpeed ?? (0.8 + Math.random() * 0.6);
        this.yawOscillation = params?.yawOscillation ?? (0.25 + Math.random() * 0.35);
        this.yawTimer = Math.random() * Math.PI * 2;
        this.rotorGroup = null;
        this.nacelleYaw = null;
    }

    static get displayName() { return 'Wind Turbine'; }

    createMesh() {
        const group = new THREE.Group();

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xb0b8c1,
            roughness: 0.6,
            metalness: 0.15
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xd32f2f,
            roughness: 0.4,
            metalness: 0.25,
            emissive: 0x160000,
            emissiveIntensity: 0.6
        });
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xf3f5f7,
            roughness: 0.35,
            metalness: 0.05
        });

        // Concrete footing
        const footing = new THREE.Mesh(
            new THREE.CylinderGeometry(1.9, 2.4, 1, 16),
            new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.8 })
        );
        footing.position.y = 0.5;
        footing.receiveShadow = true;
        group.add(footing);

        // Tapered tower
        const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 1.1, this.towerHeight, 20),
            baseMat
        );
        tower.position.y = this.towerHeight * 0.5 + 1;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        // Nacelle yaw joint
        this.nacelleYaw = new THREE.Group();
        this.nacelleYaw.position.y = this.towerHeight + 1;
        group.add(this.nacelleYaw);

        // Nacelle body
        const nacelleBody = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 1.2, 1.2),
            baseMat
        );
        nacelleBody.position.x = 0.6;
        nacelleBody.castShadow = true;
        nacelleBody.receiveShadow = true;
        this.nacelleYaw.add(nacelleBody);

        // Rear counterweight
        const counterweight = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.6, 1.2),
            accentMat
        );
        counterweight.position.set(-0.9, 0.05, 0);
        counterweight.castShadow = true;
        this.nacelleYaw.add(counterweight);

        // Top hatch
        const hatch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 0.25, 12),
            baseMat
        );
        hatch.position.set(0.3, 0.75, 0);
        hatch.rotation.x = Math.PI / 2;
        hatch.castShadow = true;
        this.nacelleYaw.add(hatch);

        // Rotor assembly
        this.rotorGroup = new THREE.Group();
        this.rotorGroup.position.set(1.9, 0, 0);
        this.nacelleYaw.add(this.rotorGroup);

        // Hub
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.7, 16),
            accentMat
        );
        hub.rotation.z = Math.PI / 2;
        hub.castShadow = true;
        this.rotorGroup.add(hub);

        // Blades
        const bladeGeo = new THREE.BoxGeometry(0.28, 0.7, 6.6);
        bladeGeo.translate(0, 0, 3.3);
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.x = (i * (2 * Math.PI)) / 3;
            blade.castShadow = true;
            this.rotorGroup.add(blade);
        }

        // Red tips on blades for visibility
        const tipGeo = new THREE.BoxGeometry(0.3, 0.72, 0.6);
        tipGeo.translate(0, 0, 6.0);
        for (let i = 0; i < 3; i++) {
            const tip = new THREE.Mesh(tipGeo, accentMat);
            tip.rotation.x = (i * (2 * Math.PI)) / 3;
            tip.castShadow = true;
            this.rotorGroup.add(tip);
        }

        return group;
    }

    update(dt) {
        if (this.rotorGroup) {
            this.rotorGroup.rotation.x += this.bladeSpeed * dt * Math.PI * 2;
        }
        if (this.nacelleYaw) {
            this.yawTimer += dt * this.yawOscillation;
            this.nacelleYaw.rotation.y = Math.sin(this.yawTimer) * 0.35;
        }
    }
}

EntityRegistry.register('windTurbine', WindTurbineEntity);
