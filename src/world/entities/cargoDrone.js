import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class CargoDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'cargoDrone';
        this.elapsed = Math.random() * 10;
        this.rotorGroups = [];
        this.modelGroup = null;
        this.floatAmplitude = 0.15 + Math.random() * 0.08;
        this.floatSpeed = 1.4 + Math.random() * 0.6;
        this.spinSpeed = 6 + Math.random() * 3;
        this.navLights = [];
    }

    static get displayName() { return 'Cargo Drone'; }

    createMesh() {
        const group = new THREE.Group();
        this.modelGroup = new THREE.Group();
        this.modelGroup.name = 'modelGroup';
        group.add(this.modelGroup);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2b3a4a,
            roughness: 0.5,
            metalness: 0.4
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x5dd4ff,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0x1a4a5a,
            emissiveIntensity: 0.5
        });
        const cargoMat = new THREE.MeshStandardMaterial({
            color: 0xe1a14c,
            roughness: 0.7,
            metalness: 0.1
        });
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9
        });

        const bodyGeo = new THREE.BoxGeometry(1.8, 0.4, 1.1);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        this.modelGroup.add(body);

        const domeGeo = new THREE.SphereGeometry(0.55, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, accentMat);
        dome.position.y = 0.72;
        dome.castShadow = true;
        this.modelGroup.add(dome);

        const cargoGeo = new THREE.BoxGeometry(0.9, 0.35, 0.65);
        const cargoPod = new THREE.Mesh(cargoGeo, cargoMat);
        cargoPod.position.y = 0.05;
        cargoPod.castShadow = true;
        cargoPod.receiveShadow = true;
        this.modelGroup.add(cargoPod);

        const strapGeo = new THREE.BoxGeometry(0.94, 0.04, 0.08);
        const strap1 = new THREE.Mesh(strapGeo, frameMat);
        strap1.position.set(0, 0.23, 0.28);
        const strap2 = strap1.clone();
        strap2.position.z = -0.28;
        this.modelGroup.add(strap1, strap2);

        const armGeo = new THREE.BoxGeometry(0.95, 0.08, 0.14);
        const armOffsets = [
            new THREE.Vector3(0.8, 0.55, 0.65),
            new THREE.Vector3(-0.8, 0.55, 0.65),
            new THREE.Vector3(0.8, 0.55, -0.65),
            new THREE.Vector3(-0.8, 0.55, -0.65)
        ];

        armOffsets.forEach((offset) => {
            const arm = new THREE.Mesh(armGeo, bodyMat);
            arm.position.set(offset.x * 0.5, offset.y, offset.z * 0.5);
            arm.castShadow = true;
            arm.rotation.y = Math.atan2(offset.z, offset.x);
            this.modelGroup.add(arm);

            const rotorGroup = this._createRotor(frameMat, accentMat);
            rotorGroup.position.set(offset.x, offset.y + 0.06, offset.z);
            this.modelGroup.add(rotorGroup);
            this.rotorGroups.push(rotorGroup);
        });

        const skidGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8);
        skidGeo.rotateZ(Math.PI / 2);
        const skid1 = new THREE.Mesh(skidGeo, frameMat);
        skid1.position.set(0, -0.1, 0.45);
        const skid2 = skid1.clone();
        skid2.position.z = -0.45;
        this.modelGroup.add(skid1, skid2);

        const navLightGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const navLightMat = new THREE.MeshStandardMaterial({
            color: 0x6df3ff,
            emissive: 0x3ad1ff,
            emissiveIntensity: 1.1
        });

        const navPositions = [
            new THREE.Vector3(0.95, 0.5, 0.15),
            new THREE.Vector3(-0.95, 0.5, -0.15)
        ];
        navPositions.forEach((pos) => {
            const light = new THREE.Mesh(navLightGeo, navLightMat.clone());
            light.position.copy(pos);
            this.modelGroup.add(light);
            this.navLights.push(light);
        });

        return group;
    }

    _createRotor(frameMat, accentMat) {
        const rotorGroup = new THREE.Group();
        rotorGroup.name = 'rotorGroup';

        const hubGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.12, 10);
        const hub = new THREE.Mesh(hubGeo, accentMat);
        hub.castShadow = true;
        rotorGroup.add(hub);

        const bladeGeo = new THREE.BoxGeometry(0.85, 0.02, 0.12);
        const bladeMat = frameMat;
        const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
        blade1.position.y = 0.06;
        const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
        blade2.position.y = 0.06;
        blade2.rotation.y = Math.PI / 2;
        rotorGroup.add(blade1, blade2);

        const ringGeo = new THREE.TorusGeometry(0.45, 0.03, 8, 18);
        const ring = new THREE.Mesh(ringGeo, frameMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        rotorGroup.add(ring);

        return rotorGroup;
    }

    update(dt) {
        if (!this.mesh || !this.modelGroup) return;
        this.elapsed += dt;

        const hover = Math.sin(this.elapsed * this.floatSpeed) * this.floatAmplitude;
        this.modelGroup.position.y = hover;

        this.rotorGroups.forEach((rotor) => {
            rotor.rotation.y += this.spinSpeed * dt;
        });

        const pulse = 0.6 + 0.4 * Math.sin(this.elapsed * 2.2);
        this.navLights.forEach((light) => {
            if (light.material) {
                light.material.emissiveIntensity = 0.8 + pulse * 0.8;
            }
        });
    }
}

EntityRegistry.register('cargoDrone', CargoDroneEntity);
