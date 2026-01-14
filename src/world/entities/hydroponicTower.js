import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

/**
 * Hydroponic Tower Entity
 * A vertical farming unit with rotating grow sites and LED lighting.
 */
export class HydroponicTowerEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'hydroponicTower';
        this.lights = [];
        this.time = Math.random() * 100;
        this.rotSpeed = 0.2 + Math.random() * 0.3; // Radians per second
        this.rotatingPart = null;
    }

    static get displayName() { return 'Hydroponic Tower'; }

    createMesh(params) {
        const group = new THREE.Group();

        // --- Materials ---
        const plasticMat = new THREE.MeshStandardMaterial({
            color: 0xEEEEEE,
            roughness: 0.2,
            metalness: 0.1
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.6
        });
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xFF00FF,
            emissive: 0xFF00FF,
            emissiveIntensity: 1.0,
            toneMapped: false
        });

        // Variations of green for plants
        const plantMats = [
            new THREE.MeshStandardMaterial({ color: 0x66BB6A, roughness: 0.8 }), // Light Green
            new THREE.MeshStandardMaterial({ color: 0x43A047, roughness: 0.8 }), // Med Green
            new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8 }), // Dark Green
            new THREE.MeshStandardMaterial({ color: 0x8BC34A, roughness: 0.8 })  // Lime
        ];

        // --- Geometry ---

        // 1. Base Reservoir (Hexagonal for tech feel)
        const baseHeight = 0.5;
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, baseHeight, 6);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Main Tower Column
        const towerHeight = 2.0 + Math.random() * 0.8;
        const towerRadius = 0.15;
        const towerGeo = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
        const tower = new THREE.Mesh(towerGeo, plasticMat);

        // Tower sits on top of base
        tower.position.y = baseHeight + (towerHeight / 2);
        tower.castShadow = true;
        tower.receiveShadow = true;

        // We add the tower to the group, but we'll rotate it in update()
        this.rotatingPart = tower;
        group.add(tower);

        // 3. Grow Cups & Plants
        const levels = Math.floor(towerHeight * 3); // Density of levels
        const plantsPerLevel = 4;

        // Simple low-poly shapes for plants
        const leafyGeo = new THREE.DodecahedronGeometry(0.12, 0);
        const spikyGeo = new THREE.ConeGeometry(0.08, 0.2, 5);

        for(let i=0; i<levels; i++) {
            // Distribute along height, leaving room at bottom and top
            const levelY = - (towerHeight / 2) + 0.2 + (i * (towerHeight - 0.4) / (levels - 1));

            // Stagger every other level
            const offsetAngle = (i % 2) * (Math.PI / plantsPerLevel);

            for(let j=0; j<plantsPerLevel; j++) {
                const angle = offsetAngle + (j * Math.PI * 2 / plantsPerLevel);

                // Cup protrusion
                const cupLength = 0.1;
                const cupGeo = new THREE.CylinderGeometry(0.06, 0.04, cupLength, 8);
                const cup = new THREE.Mesh(cupGeo, plasticMat);

                // Orient cup outward
                cup.rotation.z = Math.PI / 2;
                cup.rotation.y = angle;

                // Position on surface of tower
                cup.position.set(
                    Math.cos(angle) * (towerRadius + cupLength/2 - 0.02),
                    levelY,
                    Math.sin(angle) * (towerRadius + cupLength/2 - 0.02)
                );

                tower.add(cup);

                // Add Plant (90% chance)
                if (Math.random() > 0.1) {
                    const mat = plantMats[Math.floor(Math.random() * plantMats.length)];
                    const isSpiky = Math.random() > 0.7;
                    const plantMesh = new THREE.Mesh(isSpiky ? spikyGeo : leafyGeo, mat);

                    // Position at end of cup
                    plantMesh.position.x = cupLength / 2;
                    // Random rotation for organic look
                    plantMesh.rotation.z = -Math.PI / 2; // Point up relative to cup
                    plantMesh.rotation.x = (Math.random() - 0.5);

                    // Scale variation
                    const scale = 0.8 + Math.random() * 0.5;
                    plantMesh.scale.setScalar(scale);

                    cup.add(plantMesh);
                }
            }
        }

        // 4. Top Cap & Light
        const capGeo = new THREE.CylinderGeometry(towerRadius + 0.02, towerRadius + 0.02, 0.1, 16);
        const cap = new THREE.Mesh(capGeo, baseMat);
        cap.position.y = towerHeight / 2 + 0.05;
        tower.add(cap);

        // Emissive Ring on Cap
        const ringGeo = new THREE.TorusGeometry(towerRadius, 0.02, 8, 16);
        const ring = new THREE.Mesh(ringGeo, lightMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02; // Slightly above cap center
        cap.add(ring);
        this.lights.push(ring);

        // Vertical Light Strip (Internal Glow effect)
        // We'll simulate this by adding a thin emissive cylinder inside that scales with pulse
        // actually just easier to add a small emissive sphere at the top
        const beaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const beacon = new THREE.Mesh(beaconGeo, lightMat);
        beacon.position.y = 0.08;
        cap.add(beacon);
        this.lights.push(beacon);

        return group;
    }

    update(dt) {
        this.time += dt;

        // Rotate the tower column
        if (this.rotatingPart) {
            this.rotatingPart.rotation.y += this.rotSpeed * dt;
        }

        // Pulse the grow lights
        // Photosynthesis pulse!
        const intensity = 1.0 + Math.sin(this.time * 3.0) * 0.5;

        this.lights.forEach(light => {
            light.material.emissiveIntensity = intensity;
        });
    }
}

EntityRegistry.register('hydroponicTower', HydroponicTowerEntity);
