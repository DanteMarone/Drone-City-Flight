import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class PlaygroundSeesawEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'playgroundSeesaw';
        this.timer = Math.random() * 100; // Random start phase so they don't all sync
    }

    static get displayName() { return 'Playground Seesaw'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.4,
            metalness: 0.6
        });
        const beamMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            roughness: 0.8
        }); // Yellow wood/plastic
        const seatMat = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            roughness: 0.6
        }); // Red seats
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.8
        });

        // --- Fulcrum (Base) ---
        // A sturdy base support
        const supportGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const base = new THREE.Mesh(supportGeo, metalMat);
        base.position.y = 0.3; // Half height
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // --- Beam Group (Pivot Point) ---
        this.beamGroup = new THREE.Group();
        this.beamGroup.position.y = 0.55; // Top of support
        group.add(this.beamGroup);

        // Main Beam
        const beamGeo = new THREE.BoxGeometry(3.0, 0.15, 0.3);
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.castShadow = true;
        this.beamGroup.add(beam);

        // Seats & Handles at both ends
        const seatGeo = new THREE.BoxGeometry(0.4, 0.05, 0.35);

        // Handle parts
        const postGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25);
        const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3);

        [-1.3, 1.3].forEach(x => {
            const dir = Math.sign(x);

            // Seat
            const seat = new THREE.Mesh(seatGeo, seatMat);
            seat.position.set(x, 0.1, 0); // On top of beam
            seat.castShadow = true;
            this.beamGroup.add(seat);

            // Handle T-Bar
            // Positioned slightly towards the center from the seat center
            const handleX = x - (0.3 * dir);

            const post = new THREE.Mesh(postGeo, handleMat);
            post.position.set(handleX, 0.15 + 0.125, 0); // Above beam
            this.beamGroup.add(post);

            const bar = new THREE.Mesh(barGeo, handleMat);
            bar.position.copy(post.position);
            bar.position.y += 0.125; // Top of post
            bar.rotation.x = Math.PI / 2; // Horizontal across Z
            this.beamGroup.add(bar);
        });

        // Add a central pivot axle visual
        const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45);
        axleGeo.rotateX(Math.PI / 2);
        const axle = new THREE.Mesh(axleGeo, metalMat);
        this.beamGroup.add(axle);

        return group;
    }

    update(dt) {
        this.timer += dt;
        if (this.beamGroup) {
            // Rock back and forth
            // Max angle: ~15 degrees = 0.26 rad
            // Speed: 2.0 rad/s
            this.beamGroup.rotation.z = Math.sin(this.timer * 2.0) * 0.25;
        }
    }
}

EntityRegistry.register('playgroundSeesaw', PlaygroundSeesawEntity);
