import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class LighthouseEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'lighthouse';
        this.lightRotationSpeed = params.rotationSpeed || 1.5;
        this._time = 0;
        this.lanternGroup = null; // Group to rotate
    }

    static get displayName() { return 'Lighthouse'; }

    createMesh(params) {
        const height = params.height || 20;
        const baseRadius = params.baseRadius || 2.5;
        const topRadius = params.topRadius || 1.2;

        this.params.height = height;
        this.params.baseRadius = baseRadius;
        this.params.topRadius = topRadius;

        const group = new THREE.Group();

        // --- Materials ---
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.9,
            metalness: 0.1
        });

        const redStripeMat = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            roughness: 0.7,
            metalness: 0.1
        });

        const whiteStripeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1
        });

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.5, // Glass-like
            opacity: 0.6,
            transparent: true
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.8
        });

        // --- Geometry Construction ---

        // 1. Base (Foundation)
        const baseHeight = 2;
        const baseGeo = new THREE.CylinderGeometry(baseRadius + 0.5, baseRadius + 1, baseHeight, 8);
        const base = new THREE.Mesh(baseGeo, concreteMat);
        base.position.y = baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Tower (Striped)
        // We'll stack 4 cylinders to make 4 bands (White, Red, White, Red)
        // The total height of the tower part is (height - baseHeight - lanternHeight)
        const lanternHeight = 4;
        const towerHeight = height - baseHeight - lanternHeight;
        const bandCount = 4;
        const bandHeight = towerHeight / bandCount;

        for (let i = 0; i < bandCount; i++) {
            // Lerp radius for tapering
            const yBottom = baseHeight + i * bandHeight;
            const yTop = yBottom + bandHeight;

            const progressBottom = i / bandCount;
            const progressTop = (i + 1) / bandCount;

            const rBottom = THREE.MathUtils.lerp(baseRadius, topRadius, progressBottom);
            const rTop = THREE.MathUtils.lerp(baseRadius, topRadius, progressTop);

            const bandGeo = new THREE.CylinderGeometry(rTop, rBottom, bandHeight, 16);

            // Alternate Red/White, starting with White
            const mat = (i % 2 === 0) ? whiteStripeMat : redStripeMat;

            const band = new THREE.Mesh(bandGeo, mat);
            band.position.y = yBottom + bandHeight / 2;
            band.castShadow = true;
            band.receiveShadow = true;
            group.add(band);
        }

        // 3. Lantern Room Area
        const lanternBaseY = baseHeight + towerHeight;

        // Balcony / Walkway
        const balconyGeo = new THREE.CylinderGeometry(topRadius * 1.8, topRadius * 1.2, 0.5, 16);
        const balcony = new THREE.Mesh(balconyGeo, metalMat);
        balcony.position.y = lanternBaseY + 0.25;
        balcony.castShadow = true;
        balcony.receiveShadow = true;
        group.add(balcony);

        // Railing (Torus)
        const railingGeo = new THREE.TorusGeometry(topRadius * 1.7, 0.1, 8, 16);
        const railing = new THREE.Mesh(railingGeo, metalMat);
        railing.rotation.x = Math.PI / 2;
        railing.position.y = lanternBaseY + 1.2;
        group.add(railing);

        // Glass Room
        const roomGeo = new THREE.CylinderGeometry(topRadius * 0.9, topRadius * 0.9, 2.5, 12);
        const room = new THREE.Mesh(roomGeo, glassMat);
        room.position.y = lanternBaseY + 1.5; // Sit on balcony
        group.add(room);

        // Roof (Dome)
        const roofGeo = new THREE.SphereGeometry(topRadius * 1.1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const roof = new THREE.Mesh(roofGeo, redStripeMat);
        roof.position.y = lanternBaseY + 2.75;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);

        // Pinnacle
        const pinGeo = new THREE.CylinderGeometry(0.1, 0.2, 1, 8);
        const pin = new THREE.Mesh(pinGeo, metalMat);
        pin.position.y = lanternBaseY + 3.25 + 0.5;
        group.add(pin);

        // 4. Rotating Light Assembly
        this.lanternGroup = new THREE.Group();
        this.lanternGroup.position.y = lanternBaseY + 1.5; // Inside glass room
        group.add(this.lanternGroup);

        // The "Bulb"
        const bulbGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, toneMapped: false });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        this.lanternGroup.add(bulb);

        // The "Beam" (Cone)
        // A long cone extending outward
        const beamLength = 40;
        const beamGeo = new THREE.ConeGeometry(4, beamLength, 32, 1, true);
        beamGeo.translate(0, beamLength / 2, 0); // Move base to origin
        beamGeo.rotateX(-Math.PI / 2); // Point along Z axis

        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });

        const beam = new THREE.Mesh(beamGeo, beamMat);
        // Offset slightly forward so it starts at the edge of the bulb
        beam.position.z = 0.4;
        this.lanternGroup.add(beam);

        // Store bulb for LightSystem registration
        this.bulbMesh = bulb;

        return group;
    }

    postInit() {
        // Register virtual light
        if (window.app && window.app.world && window.app.world.lightSystem) {
            // Register a light that tracks the bulb mesh
            // Since the bulb rotates inside the group, its world position stays centered in the lighthouse,
            // but the beam visuals handle the directionality.
            // A point light at the center is enough for "lighting up the environment".
            window.app.world.lightSystem.createLightSource(this.bulbMesh, {
                color: 0xffffaa,
                intensity: 2,
                range: 60
            });
        }
    }

    update(dt) {
        if (this.lanternGroup) {
            // Rotate the beam
            this.lanternGroup.rotation.y -= this.lightRotationSpeed * dt;
        }

        // Optional: Pulse opacity slightly?
        this._time += dt;
    }
}

EntityRegistry.register('lighthouse', LighthouseEntity);
