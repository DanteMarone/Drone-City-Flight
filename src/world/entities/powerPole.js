import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class PowerPoleEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'powerPole';
        this._time = Math.random() * Math.PI * 2;
        this._beaconMaterial = null;
        this._lightHandle = null;
        this._beaconLocalPos = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Power Pole'; }

    createMesh(params) {
        const group = new THREE.Group();

        const poleHeight = params.height || 6.4 + Math.random() * 1.1;
        const armLength = params.armLength || 2.4;
        this.params.height = poleHeight;
        this.params.armLength = armLength;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xa4a4a4,
            map: concreteTex,
            roughness: 0.88,
            metalness: 0.08
        });

        const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.32, 16), baseMaterial);
        footing.position.y = 0.16;
        footing.castShadow = true;
        footing.receiveShadow = true;
        group.add(footing);

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x7c5a3a,
            roughness: 0.65,
            metalness: 0.22
        });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, poleHeight, 14), poleMaterial);
        pole.position.y = footing.position.y + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const strapMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.4, metalness: 0.7 });
        for (let i = 0; i < 3; i++) {
            const strap = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.08, 0.015, 8, 16), strapMaterial);
            strap.rotation.x = Math.PI / 2;
            strap.position.y = pole.position.y + (i * poleHeight / 6);
            strap.castShadow = false;
            group.add(strap);
        }

        const crossArmMaterial = new THREE.MeshStandardMaterial({
            color: 0x5f4c3b,
            roughness: 0.55,
            metalness: 0.35
        });
        const armGeo = new THREE.BoxGeometry(armLength, 0.16, 0.26);

        const upperArm = new THREE.Mesh(armGeo, crossArmMaterial);
        upperArm.position.set(0, pole.position.y + poleHeight / 2 - 0.45, 0);
        upperArm.castShadow = true;
        upperArm.receiveShadow = true;
        group.add(upperArm);

        const lowerArm = new THREE.Mesh(armGeo, crossArmMaterial);
        lowerArm.position.set(0, upperArm.position.y - 0.5, -0.08);
        lowerArm.castShadow = true;
        lowerArm.receiveShadow = true;
        group.add(lowerArm);

        const braceGeo = new THREE.BoxGeometry(0.12, 0.7, 0.08);
        const braceMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4b4b, roughness: 0.5, metalness: 0.6 });
        const braceLeft = new THREE.Mesh(braceGeo, braceMaterial);
        braceLeft.position.set(-armLength / 3, upperArm.position.y - 0.35, -0.1);
        group.add(braceLeft);
        const braceRight = braceLeft.clone();
        braceRight.position.x = armLength / 3;
        group.add(braceRight);

        const insulatorGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.16, 10);
        const insulatorMat = new THREE.MeshStandardMaterial({
            color: 0x94d9ff,
            emissive: new THREE.Color(0x3fa7ff),
            emissiveIntensity: 0.35,
            roughness: 0.4,
            metalness: 0.15
        });

        const insulatorGroup = new THREE.Group();
        const armOffsets = [upperArm.position, lowerArm.position];
        armOffsets.forEach((armPos, idx) => {
            const depthShift = idx === 0 ? 0.08 : -0.05;
            [-1, 0, 1].forEach((lane, laneIndex) => {
                const insulator = new THREE.Mesh(insulatorGeo, insulatorMat);
                insulator.position.set((armLength / 2 - 0.2) * lane, armPos.y + 0.02, depthShift + laneIndex * 0.02);
                insulator.castShadow = true;
                insulator.receiveShadow = true;
                insulatorGroup.add(insulator);
            });
        });
        group.add(insulatorGroup);

        const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.05 });
        const wireGroup = new THREE.Group();
        const wireHeights = [upperArm.position.y + 0.05, upperArm.position.y - 0.05, lowerArm.position.y + 0.03];
        wireHeights.forEach((y, idx) => {
            const zOffset = -0.05 + idx * 0.05;
            const start = new THREE.Vector3(-armLength / 2 + 0.2, y, zOffset);
            const end = new THREE.Vector3(armLength / 2 - 0.2, y, zOffset + 0.02);
            const mid = start.clone().add(end).multiplyScalar(0.5);
            mid.y -= 0.35 + idx * 0.04;
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const tube = new THREE.TubeGeometry(curve, 20, 0.014, 6, false);
            const wire = new THREE.Mesh(tube, cableMaterial);
            wire.castShadow = true;
            wireGroup.add(wire);
        });
        group.add(wireGroup);

        const beaconGroup = new THREE.Group();
        beaconGroup.position.y = pole.position.y + poleHeight / 2 + 0.18;

        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), strapMaterial);
        beaconBase.castShadow = true;
        beaconGroup.add(beaconBase);

        const lensMaterial = new THREE.MeshStandardMaterial({
            color: 0xff5a5a,
            emissive: new THREE.Color(0xff2d2d),
            emissiveIntensity: 1.4,
            roughness: 0.35,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        this._beaconMaterial = lensMaterial;

        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), lensMaterial);
        lens.position.y = 0.12;
        lens.castShadow = false;
        beaconGroup.add(lens);

        this._beaconLocalPos = new THREE.Vector3(0, beaconGroup.position.y + lens.position.y, 0);
        group.add(beaconGroup);

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation = this.mesh.rotation.clone();
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._beaconLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._beaconLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this.params.beaconColor || 0xff2d2d,
                this.params.lightIntensity || 1.6,
                this.params.lightRange || 22
            );

            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        const sway = Math.sin(this._time * 0.45 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(1.4);
        if (this._baseRotation) {
            this.mesh.rotation.set(
                this._baseRotation.x + Math.sin(this._time * 0.32) * THREE.MathUtils.degToRad(0.6),
                this._baseRotation.y,
                this._baseRotation.z + sway
            );
        }

        const blink = Math.sin(this._time * 2.6);
        const isOn = blink > 0.25;
        if (this._beaconMaterial) {
            this._beaconMaterial.emissiveIntensity = isOn ? 1.8 : 0.1;
            this._beaconMaterial.opacity = isOn ? 0.95 : 0.4;
        }

        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 1.6;
            this._lightHandle.intensity = isOn ? baseIntensity : baseIntensity * 0.05;
        }
    }
}

EntityRegistry.register('powerPole', PowerPoleEntity);
