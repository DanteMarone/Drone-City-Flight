import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const BODY_COLORS = [0x3b4457, 0x48525f, 0x1f2937, 0x334155];
const ACCENT_COLORS = [0x38bdf8, 0xf59e0b, 0xa855f7, 0x22c55e];

export class CargoDroneEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'cargoDrone';
        this._time = 0;
        this._rotors = [];
        this._bodyGroup = null;
        this._baseHoverHeight = 0;
        this._pulseMaterial = null;
        this._tiltPhase = params.tiltPhase ?? Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Cargo Drone'; }

    createMesh(params) {
        const group = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        group.add(modelGroup);

        const bodyColor = params.bodyColor ?? BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)];
        const accentColor = params.accentColor ?? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
        const hoverHeight = params.hoverHeight ?? 0.65 + Math.random() * 0.2;
        this.params.bodyColor = bodyColor;
        this.params.accentColor = accentColor;
        this.params.hoverHeight = hoverHeight;
        this.params.tiltPhase = this._tiltPhase;

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.45,
            metalness: 0.55
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.35,
            metalness: 0.35
        });
        const darkMaterial = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.6,
            metalness: 0.3
        });

        const chassis = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 0.45, 20), bodyMaterial);
        chassis.position.y = hoverHeight + 0.75;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        modelGroup.add(chassis);

        const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 14), darkMaterial);
        cockpit.position.set(0, chassis.position.y + 0.1, 0.45);
        cockpit.scale.set(1.1, 0.7, 1.2);
        cockpit.castShadow = true;
        cockpit.receiveShadow = false;
        modelGroup.add(cockpit);

        const cargoPod = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.65), accentMaterial);
        cargoPod.position.set(0, hoverHeight + 0.35, 0);
        cargoPod.castShadow = true;
        cargoPod.receiveShadow = true;
        modelGroup.add(cargoPod);

        const strapMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.7,
            metalness: 0.2
        });
        const strapGeo = new THREE.BoxGeometry(0.78, 0.06, 0.1);
        const strapFront = new THREE.Mesh(strapGeo, strapMaterial);
        strapFront.position.set(0, cargoPod.position.y + 0.12, 0.24);
        modelGroup.add(strapFront);
        const strapRear = strapFront.clone();
        strapRear.position.z = -0.24;
        modelGroup.add(strapRear);

        const armGeo = new THREE.BoxGeometry(1.6, 0.12, 0.18);
        const armX = new THREE.Mesh(armGeo, bodyMaterial);
        armX.position.set(0, chassis.position.y + 0.05, 0);
        armX.castShadow = true;
        armX.receiveShadow = true;
        modelGroup.add(armX);

        const armZ = new THREE.Mesh(armGeo, bodyMaterial);
        armZ.rotation.y = Math.PI / 2;
        armZ.position.set(0, chassis.position.y + 0.05, 0);
        armZ.castShadow = true;
        armZ.receiveShadow = true;
        modelGroup.add(armZ);

        const skidMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
            roughness: 0.65,
            metalness: 0.25
        });
        const skidGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 10);
        const skidLeft = new THREE.Mesh(skidGeo, skidMaterial);
        skidLeft.rotation.z = Math.PI / 2;
        skidLeft.position.set(0, hoverHeight + 0.12, 0.35);
        modelGroup.add(skidLeft);
        const skidRight = skidLeft.clone();
        skidRight.position.z = -0.35;
        modelGroup.add(skidRight);

        const strutGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 10);
        const strutOffsets = [
            [0.45, 0.2, 0.35],
            [-0.45, 0.2, 0.35],
            [0.45, 0.2, -0.35],
            [-0.45, 0.2, -0.35]
        ];
        strutOffsets.forEach(([x, y, z]) => {
            const strut = new THREE.Mesh(strutGeo, skidMaterial);
            strut.position.set(x, hoverHeight + y, z);
            strut.castShadow = true;
            strut.receiveShadow = true;
            modelGroup.add(strut);
        });

        const rotorPositions = [
            [0.8, 0.0, 0.8, 1],
            [-0.8, 0.0, 0.8, -1],
            [0.8, 0.0, -0.8, -1],
            [-0.8, 0.0, -0.8, 1]
        ];

        rotorPositions.forEach(([x, y, z, dir]) => {
            const rotorGroup = new THREE.Group();
            rotorGroup.position.set(x, chassis.position.y + 0.15 + y, z);

            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), darkMaterial);
            hub.rotation.x = Math.PI / 2;
            rotorGroup.add(hub);

            const bladeGeo = new THREE.BoxGeometry(0.9, 0.02, 0.12);
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0xd1d5db,
                roughness: 0.4,
                metalness: 0.6
            });
            const bladeA = new THREE.Mesh(bladeGeo, bladeMaterial);
            const bladeB = new THREE.Mesh(bladeGeo, bladeMaterial);
            bladeB.rotation.y = Math.PI / 2;
            rotorGroup.add(bladeA, bladeB);

            const guard = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 24), skidMaterial);
            guard.rotation.x = Math.PI / 2;
            guard.position.y = 0.02;
            rotorGroup.add(guard);

            rotorGroup.userData.spinDirection = dir;
            this._rotors.push(rotorGroup);
            modelGroup.add(rotorGroup);
        });

        const navLightMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.9
        });
        this._pulseMaterial = navLightMaterial;

        const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), navLightMaterial);
        navLight.position.set(0, chassis.position.y + 0.25, -0.55);
        modelGroup.add(navLight);

        this._bodyGroup = modelGroup;
        this._baseHoverHeight = hoverHeight;

        return group;
    }

    update(dt) {
        if (!this.mesh || !this._bodyGroup) return;

        this._time += dt;
        const bob = Math.sin(this._time * 2 + this._tiltPhase) * 0.05;
        const tilt = Math.sin(this._time * 1.2 + this._tiltPhase) * THREE.MathUtils.degToRad(2.5);
        this._bodyGroup.position.y = this._baseHoverHeight + bob;
        this._bodyGroup.rotation.z = tilt;
        this._bodyGroup.rotation.x = Math.sin(this._time * 1.6 + this._tiltPhase) * THREE.MathUtils.degToRad(1.5);

        this._rotors.forEach(rotor => {
            rotor.rotation.y += dt * 12 * rotor.userData.spinDirection;
        });

        if (this._pulseMaterial) {
            const pulse = 0.6 + 0.4 * Math.sin(this._time * 4.5);
            this._pulseMaterial.emissiveIntensity = 0.8 + pulse;
            this._pulseMaterial.opacity = 0.75 + pulse * 0.2;
        }

        if (this.box) {
            this._bodyGroup.updateMatrixWorld();
            this.box.setFromObject(this.mesh);
        }
    }
}

EntityRegistry.register('cargoDrone', CargoDroneEntity);
