import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class QuantumComputerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'quantumComputer';

        // Animation State
        this._time = Math.random() * 100;

        // References for animation
        this._levitationGroup = null;
        this._core = null;
        this._outerRing = null;
        this._middleRing = null;
        this._innerRing = null;
    }

    static get displayName() { return 'Quantum Computer'; }

    createMesh(params) {
        const group = new THREE.Group();

        // --- Base Platform ---
        // Trapezoidal base: darker metal
        const baseGeom = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 32);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.7,
            metalness: 0.5
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.25; // Half height
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // --- Levitation Group ---
        this._levitationGroup = new THREE.Group();
        this._levitationGroup.position.y = 1.8; // Floating center height
        group.add(this._levitationGroup);

        // --- Core (The "Quantum Bit") ---
        const coreGeom = new THREE.IcosahedronGeometry(0.4, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
            roughness: 0.1,
            metalness: 0.1
        });
        this._core = new THREE.Mesh(coreGeom, coreMat);
        this._core.castShadow = true;
        this._levitationGroup.add(this._core);

        // --- Rings (The "Field Generators") ---

        // Outer Ring (Gold, Vertical Spin)
        const outerGeom = new THREE.TorusGeometry(1.2, 0.05, 8, 64);
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.2,
            metalness: 1.0
        });
        this._outerRing = new THREE.Mesh(outerGeom, outerMat);
        this._levitationGroup.add(this._outerRing);

        // Middle Ring (Silver, Horizontal Spin)
        const midGeom = new THREE.TorusGeometry(0.9, 0.05, 8, 64);
        const midMat = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            roughness: 0.2,
            metalness: 1.0
        });
        this._middleRing = new THREE.Mesh(midGeom, midMat);
        this._middleRing.rotation.x = Math.PI / 2; // Start horizontal
        this._levitationGroup.add(this._middleRing);

        // Inner Ring (Copper, Tilted Spin)
        const innerGeom = new THREE.TorusGeometry(0.6, 0.05, 8, 64);
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0xb87333,
            roughness: 0.2,
            metalness: 1.0
        });
        this._innerRing = new THREE.Mesh(innerGeom, innerMat);
        this._innerRing.rotation.x = Math.PI / 4;
        this._levitationGroup.add(this._innerRing);

        // --- Shadow Caster for Levitating parts ---
        // (The rings might not cast nice shadows by default depending on light angle,
        // but Three.js handles it if castShadow is true)
        this._outerRing.castShadow = true;
        this._middleRing.castShadow = true;
        this._innerRing.castShadow = true;

        return group;
    }

    update(dt) {
        this._time += dt;

        if (this._levitationGroup) {
            // Bobbing motion
            this._levitationGroup.position.y = 1.8 + Math.sin(this._time) * 0.1;
        }

        if (this._core) {
            // Pulse emissive intensity
            // 0.5 to 1.5 range
            this._core.material.emissiveIntensity = 1.0 + Math.sin(this._time * 3) * 0.5;

            // Slow core rotation
            this._core.rotation.y += dt * 0.2;
            this._core.rotation.z += dt * 0.1;
        }

        // Ring Rotations (Gyroscopic effect)
        if (this._outerRing) {
            // Rotate around Y (Global Up relative to group)
            this._outerRing.rotation.y += dt * 0.5;
        }

        if (this._middleRing) {
            // Rotate around X
            this._middleRing.rotation.x += dt * 0.7;
        }

        if (this._innerRing) {
            // Rotate around arbitrary axis or Z
            this._innerRing.rotation.z += dt * 1.1;
            this._innerRing.rotation.x += dt * 0.3;
        }
    }
}

EntityRegistry.register('quantumComputer', QuantumComputerEntity);
