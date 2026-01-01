import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class OilPumpJackEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'oilPumpJack';
        this.pumpSpeed = params.pumpSpeed || 2.0;
        this._time = Math.random() * 100;

        // References for animation
        this._crank = null;
        this._counterWeight = null;
        this._beam = null;
        this._horseHead = null;
        this._pitmanArm = null;
        this._rod = null;
    }

    static get displayName() { return 'Oil Pump Jack'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Colors
        const metalColor = new THREE.Color(0x556677);
        const paintColor = new THREE.Color(params.color || 0xd65a31); // Default rusty orange
        const concreteColor = new THREE.Color(0x999999);
        const blackColor = new THREE.Color(0x222222);

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.6, metalness: 0.5 });
        const paintMat = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.7, metalness: 0.1 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: concreteColor, roughness: 0.9 });
        const cableMat = new THREE.MeshStandardMaterial({ color: blackColor, roughness: 0.5 });

        // 1. Base (Concrete Slab)
        const baseGeo = new THREE.BoxGeometry(3, 0.5, 8);
        const base = new THREE.Mesh(baseGeo, concreteMat);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. Samson Post (A-Frame Tower)
        const postGroup = new THREE.Group();
        postGroup.position.set(0, 0.5, 0); // Center of base
        group.add(postGroup);

        const legHeight = 4;
        const legSpread = 1.2;

        // Legs (simplified A-frame)
        const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 4.5);
        const leg1 = new THREE.Mesh(legGeo, paintMat);
        leg1.position.set(0.6, 2, 0);
        leg1.rotation.z = -0.15;
        postGroup.add(leg1);

        const leg2 = new THREE.Mesh(legGeo, paintMat);
        leg2.position.set(-0.6, 2, 0);
        leg2.rotation.z = 0.15;
        postGroup.add(leg2);

        const leg3 = new THREE.Mesh(legGeo, paintMat);
        leg3.position.set(0, 2, 1.5);
        leg3.rotation.x = -0.2;
        postGroup.add(leg3);

        // Top bearing
        const bearingGeo = new THREE.BoxGeometry(1.6, 0.4, 0.4);
        const bearing = new THREE.Mesh(bearingGeo, metalMat);
        bearing.position.set(0, 4, 0);
        postGroup.add(bearing);

        // 3. Walking Beam (The main lever)
        this._beam = new THREE.Group();
        this._beam.position.set(0, 4.5, 0); // Pivot point
        group.add(this._beam);

        // Main Beam
        const beamGeo = new THREE.BoxGeometry(0.4, 0.6, 6);
        const beamMesh = new THREE.Mesh(beamGeo, paintMat);
        // Pivot is not in center, usually closer to rear
        // Let's say pivot is at 0. Beam goes from z=-2 to z=4
        beamMesh.position.set(0, 0, 1);
        beamMesh.castShadow = true;
        this._beam.add(beamMesh);

        // Horse Head (Front curve)
        const headGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16, 1, false, 0, Math.PI);
        const head = new THREE.Mesh(headGeo, paintMat);
        head.rotation.z = Math.PI / 2;
        head.position.set(0, -1.2, 4); // End of beam
        this._beam.add(head);
        this._horseHead = head;

        // 4. Counterweights & Crank (Rear)
        const motorGroup = new THREE.Group();
        motorGroup.position.set(0, 1.5, -2.5);
        group.add(motorGroup);

        // Motor box
        const motorGeo = new THREE.BoxGeometry(1, 1, 1);
        const motor = new THREE.Mesh(motorGeo, metalMat);
        motorGroup.add(motor);

        // Crank Axis
        this._crank = new THREE.Group();
        this._crank.position.set(0, 0, 0); // Relative to motorGroup
        motorGroup.add(this._crank);

        // Counterweight (The big heavy spinning things)
        const weightGeo = new THREE.BoxGeometry(0.5, 1.5, 0.8);
        const weightLeft = new THREE.Mesh(weightGeo, metalMat);
        weightLeft.position.set(0.8, 0, 0);
        this._crank.add(weightLeft);

        const weightRight = new THREE.Mesh(weightGeo, metalMat);
        weightRight.position.set(-0.8, 0, 0);
        this._crank.add(weightRight);

        // 5. Pitman Arm (Connecting Rods)
        // These connect the crank to the back of the beam
        // Visual only: we'll rotate them to "look" connected
        this._pitmanArm = new THREE.Group();
        // Positioned at the crank handle position approx
        group.add(this._pitmanArm);

        const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5);
        const rodLeft = new THREE.Mesh(rodGeo, metalMat);
        rodLeft.position.x = 0.8;
        this._pitmanArm.add(rodLeft);

        const rodRight = new THREE.Mesh(rodGeo, metalMat);
        rodRight.position.x = -0.8;
        this._pitmanArm.add(rodRight);

        // 6. Polished Rod (Vertical Cable/Rod going into ground)
        // Moves up/down
        this._rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), metalMat);
        this._rod.position.set(0, 2, 4); // Under horse head
        group.add(this._rod);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt * this.pumpSpeed;

        // 1. Rotate Crank
        if (this._crank) {
            this._crank.rotation.x = this._time;
        }

        // 2. Rock Beam (Sine wave based on crank)
        // When crank is up (sin=1), beam rear is up, beam front is down?
        // Let's simplify: Beam rocks +/- 15 degrees
        const angle = Math.sin(this._time) * 0.25;

        if (this._beam) {
            this._beam.rotation.x = angle;
        }

        // 3. Move Pitman Arm
        // Visual approximation: Position follows crank, points to beam rear
        // Crank center: (0, 1.5, -2.5)
        // Beam rear pivot: (0, 4.5, -2) approx
        if (this._pitmanArm) {
            // Move arm center up/down with crank
            // Crank radius ~ 0.5
            const crankY = Math.sin(this._time) * 0.5;
            const crankZ = Math.cos(this._time) * 0.5;

            // Base pos (motor) + offset
            this._pitmanArm.position.set(0, 1.5 + crankY + 1.5, -2.5 + crankZ);
            // Look at beam rear?
            // Ideally we do Inverse Kinematics, but simple rotation is enough for distance
            this._pitmanArm.rotation.x = angle * -0.5;
        }

        // 4. Move Polished Rod (Vertical)
        // Connected to horse head
        if (this._rod) {
             // Beam tip moves up/down opposite to rear
             // Tip is at +4 Z from pivot
             // Delta Y ~ sin(angle) * dist
             const tipY = Math.sin(angle) * 4;
             this._rod.position.y = 2.5 + tipY; // Base height + delta
        }
    }
}

EntityRegistry.register('oilPumpJack', OilPumpJackEntity);
