import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class CrystalFormationEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'crystalFormation';
        this._time = Math.random() * Math.PI * 2;
        this._crystals = [];
        this._lightHandle = null;
        this._lightLocalPos = null;

        // Seed logic for variations
        // Compute simple hash from seed string if provided, else random
        const seedVal = params.seed ?
            String(params.seed).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
            : Math.random() * 1000;

        this._colorTheme = (seedVal % 2 === 0) ? 0xcc88ff : 0x88ccff; // Purple or Cyan
    }

    static get displayName() { return 'Crystal Geode'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Base Rock
        const baseGeo = new THREE.DodecahedronGeometry(1.0, 0);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.scale.set(1.2, 0.3, 1.2);
        base.position.y = 0.15;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        // Crystals
        const crystalCount = 5 + Math.floor(Math.random() * 5); // 5-9

        const crystalMat = new THREE.MeshStandardMaterial({
            color: this._colorTheme,
            emissive: this._colorTheme,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.85,
            flatShading: true
        });

        for (let i = 0; i < crystalCount; i++) {
            const height = 0.8 + Math.random() * 0.8;
            const radius = 0.15 + Math.random() * 0.15;
            const segments = 4 + Math.floor(Math.random() * 3); // 4-6

            const geo = new THREE.CylinderGeometry(0, radius, height, segments, 1);
            geo.translate(0, height / 2, 0); // Pivot at bottom

            const mesh = new THREE.Mesh(geo, crystalMat.clone());

            // Random position on the base
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.6;
            mesh.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);

            // Random tilt
            mesh.rotation.x = (Math.random() - 0.5) * 0.6;
            mesh.rotation.z = (Math.random() - 0.5) * 0.6;
            mesh.rotation.y = Math.random() * Math.PI * 2;

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            group.add(mesh);

            this._crystals.push({
                mesh: mesh,
                speed: 1.0 + Math.random(),
                phase: Math.random() * Math.PI * 2,
                baseEmissive: 0.5
            });
        }

        this._lightLocalPos = new THREE.Vector3(0, 1.0, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || (typeof window !== 'undefined' && window.app && window.app.world && window.app.world.lightSystem);
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(
                worldPos,
                this._colorTheme,
                2.0,
                6.0
            );
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        // Pulse Crystals
        for (const c of this._crystals) {
            const pulse = 0.5 + 0.5 * Math.sin(this._time * c.speed + c.phase);
            c.mesh.material.emissiveIntensity = 0.5 + pulse * 1.5;
        }

        // Pulse Light
        if (this._lightHandle) {
             const mainPulse = 0.8 + 0.4 * Math.sin(this._time * 2.0);
             this._lightHandle.intensity = 2.0 * mainPulse;
        }

        // Particles
        if (typeof window !== 'undefined' && window.app && window.app.particles) {
            if (Math.random() < dt * 2.0) { // ~2 particles per second
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    0.5 + Math.random() * 1.0,
                    (Math.random() - 0.5) * 0.8
                );
                const pos = this.mesh.position.clone().add(offset);
                window.app.particles.emit(pos, 1, this._colorTheme);
            }
        }
    }
}

EntityRegistry.register('crystalFormation', CrystalFormationEntity);
