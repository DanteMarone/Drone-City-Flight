import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class GazeboEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'gazebo';
        this._lightLocalPos = null;
        this._virtualLight = null;
        this._glowMaterial = null;
    }

    static get displayName() { return 'Gazebo'; }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Base (Hexagonal Platform)
        // Radius 2.5, Height 0.3
        const baseGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 6);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa, // Light Grey Concrete
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Pillars
        // 6 pillars at the corners
        const pillarHeight = 3.0;
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, pillarHeight, 8);
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8B5A2B, // Wood brown
            roughness: 0.8
        });

        // Calculate pillar positions
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = 2.3; // Slightly inside the edge
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            const pillar = new THREE.Mesh(pillarGeo, woodMat);
            pillar.position.set(x, 0.15 + pillarHeight/2, z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            group.add(pillar);
        }

        // 3. Roof (Hexagonal Cone)
        // Radius 2.8 (overhang), Height 1.5
        const roofGeo = new THREE.ConeGeometry(3.0, 1.8, 6);
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x803030, // Dark red roof
            roughness: 0.6
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 0.15 + pillarHeight + 0.9; // Base + Pillar + Half Roof Height
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // 4. Railings (between pillars, except one for entry)
        // We leave the side from angle 0 to angle 60 open (indices 0 and 1)
        // Wait, indices are 0,1,2,3,4,5.
        // 0 is at (R, 0). 1 is at (R/2, R*sqrt(3)/2).
        // Let's leave segment 0->1 open.

        for (let i = 0; i < 6; i++) {
            if (i === 0) continue; // Skip the first segment for entrance

            const angle1 = (i / 6) * Math.PI * 2;
            const angle2 = ((i + 1) / 6) * Math.PI * 2;

            const r = 2.3;
            const x1 = Math.cos(angle1) * r;
            const z1 = Math.sin(angle1) * r;
            const x2 = Math.cos(angle2) * r;
            const z2 = Math.sin(angle2) * r;

            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;

            // Calculate angle of the segment
            const segAngle = Math.atan2(z2 - z1, x2 - x1);

            // Rail dimensions
            const segLen = Math.sqrt((x2-x1)**2 + (z2-z1)**2); // Should be 2.3 ideally

            // Top rail
            const topRail = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.1, 0.1), woodMat);
            topRail.position.set(midX, 0.15 + 0.9, midZ);
            topRail.rotation.y = -segAngle; // Align with segment
            group.add(topRail);

            // Bottom rail
            const botRail = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.1, 0.1), woodMat);
            botRail.position.set(midX, 0.15 + 0.45, midZ);
            botRail.rotation.y = -segAngle;
            group.add(botRail);
        }

        // 5. Central Bench
        const benchGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 6);
        const bench = new THREE.Mesh(benchGeo, woodMat);
        bench.position.y = 0.15 + 0.2;
        bench.castShadow = true;
        bench.receiveShadow = true;
        group.add(bench);

        // 6. Lantern (Hanging from roof center)
        const lanternGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.4, 4);
        const lanternFrameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const lantern = new THREE.Mesh(lanternGeo, lanternFrameMat);
        lantern.position.y = 0.15 + pillarHeight - 0.2; // Hanging just below roof start
        group.add(lantern);

        // Lantern Glass (Emissive)
        const glassGeo = new THREE.SphereGeometry(0.12, 8, 8);
        this._glowMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            toneMapped: false // Bright even in tone mapping
        });
        const glass = new THREE.Mesh(glassGeo, this._glowMaterial);
        glass.position.y = -0.05; // Relative to lantern
        lantern.add(glass);

        // Store local light position for postInit
        this._lightLocalPos = new THREE.Vector3(0, lantern.position.y, 0);

        return group;
    }

    postInit() {
        if (window.app && window.app.world && window.app.world.lightSystem) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);

            // Register warm orange light
            // Intensity 3.0, Distance 10
            this._virtualLight = window.app.world.lightSystem.register(worldPos, 0xffaa00, 3.0, 10);

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        // Toggle light based on day/night cycle
        if (window.app && window.app.world && window.app.world.timeCycle) {
            const isNight = window.app.world.timeCycle.isNight;

            if (this._glowMaterial) {
                // Smooth transition could be better, but simple toggle works
                this._glowMaterial.emissiveIntensity = isNight ? 1.0 : 0.0;
            }

            if (this._virtualLight) {
                this._virtualLight.intensity = isNight ? 3.0 : 0.0;
            }
        }
    }
}

EntityRegistry.register('gazebo', GazeboEntity);
