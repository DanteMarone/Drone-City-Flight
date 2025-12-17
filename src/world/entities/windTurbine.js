import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class WindTurbineEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'windTurbine';
        this.spinSpeed = params.spinSpeed ?? (0.8 + Math.random() * 0.8);
        this.gustAmplitude = params.gustAmplitude ?? 0.35;
        this.timeOffset = Math.random() * Math.PI * 2;
        this.time = Math.random() * 10;
    }

    static get displayName() { return 'Wind Turbine'; }

    createMesh(params) {
        const height = params.height ?? THREE.MathUtils.randFloat(18, 28);
        const bladeLength = params.bladeLength ?? THREE.MathUtils.randFloat(8, 12);
        const bladeWidth = params.bladeWidth ?? 1.2;
        const bladeThickness = params.bladeThickness ?? 0.35;

        this.params.height = height;
        this.params.bladeLength = bladeLength;
        this.params.bladeWidth = bladeWidth;
        this.params.bladeThickness = bladeThickness;

        const group = new THREE.Group();

        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0xbfc1c2,
            roughness: 0.9
        });

        const towerMat = new THREE.MeshStandardMaterial({
            color: 0xf2f5f7,
            roughness: 0.4,
            metalness: 0.2
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0xcc3333,
            emissive: 0x330000,
            emissiveIntensity: 0.3
        });

        // Concrete pad
        const padGeo = new THREE.CylinderGeometry(3.2, 3.2, 1, 20);
        const pad = new THREE.Mesh(padGeo, concreteMat);
        pad.position.y = 0.5;
        pad.castShadow = true;
        pad.receiveShadow = true;
        group.add(pad);

        // Tapered tower
        const towerGeo = new THREE.CylinderGeometry(1.6, 0.75, height, 24);
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = height / 2 + 1;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);

        // Nacelle and hub base
        const nacelleGeo = new THREE.BoxGeometry(3.2, 1.6, 4);
        const nacelle = new THREE.Mesh(nacelleGeo, towerMat);
        nacelle.position.y = height + 1.8;
        nacelle.castShadow = true;
        nacelle.receiveShadow = true;
        group.add(nacelle);

        // Rotor group sits at the front of the nacelle
        this.rotor = new THREE.Group();
        this.rotor.position.set(0, nacelle.position.y, 2.2);
        group.add(this.rotor);

        const hubGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
        hubGeo.rotateZ(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, towerMat);
        hub.castShadow = true;
        hub.receiveShadow = true;
        this.rotor.add(hub);

        // Blade geometry offset so that the root sits at the hub center
        const bladeGeo = new THREE.BoxGeometry(bladeLength, bladeWidth, bladeThickness);
        bladeGeo.translate(bladeLength / 2 + 0.6, 0, 0);

        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeo, towerMat);
            blade.rotation.z = (i * Math.PI * 2) / 3;
            blade.castShadow = true;
            blade.receiveShadow = true;

            // Add a small red tip for visibility
            const tipGeo = new THREE.BoxGeometry(bladeLength * 0.08, bladeWidth * 0.95, bladeThickness * 1.1);
            tipGeo.translate(bladeLength / 2 + 0.6, 0, 0);
            const tip = new THREE.Mesh(tipGeo, accentMat);
            tip.position.x = bladeLength * 0.92;
            tip.castShadow = true;
            tip.receiveShadow = true;
            blade.add(tip);

            // Slight twist for aerodynamics
            blade.rotation.y = THREE.MathUtils.degToRad(6);
            this.rotor.add(blade);
        }

        return group;
    }

    update(dt) {
        if (!this.rotor) return;

        this.time += dt;
        const gust = Math.sin(this.time + this.timeOffset) * this.gustAmplitude;
        const rotationSpeed = Math.max(0.2, this.spinSpeed + gust);
        this.rotor.rotation.z += rotationSpeed * dt;
    }
}

EntityRegistry.register('windTurbine', WindTurbineEntity);
