import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class BirdEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'bird';
        // Override position Y default
        if (params.y === undefined) this.position.y = 5;
    }

    static get displayName() { return 'Bird'; }

    createMesh(params) {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();

        // Body: Cone
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
        bodyGeo.rotateX(Math.PI / 2); // Point forward (Z)
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Wings: Two thin boxes
        const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.7 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.y = 0.1;
        wings.castShadow = true;
        group.add(wings);

        group.userData.wings = wings;
        return group;
    }

    // Note: Bird logic (flying) is handled by BirdSystem, not here.
    // This entity just provides the mesh.
}

export class CowEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'cow';

        // Configuration with Defaults
        this.moveDuration = params.moveDuration || 3.0;
        this.stopDuration = params.stopDuration || 4.0;
        this.speed = params.speed || 1.5;
        this.wanderRadius = params.wanderRadius || 15.0;

        // State
        this.state = 'idle'; // 'idle' or 'walk'
        this.timer = Math.random() * this.stopDuration;
        this.spawnPos = null;
        this.currentDir = new THREE.Vector3(1, 0, 0);
        this.legGroup = null;
    }

    static get displayName() { return 'Cow'; }

    init() {
        super.init();
        if (this.mesh) {
            this.spawnPos = this.mesh.position.clone();

            // Sync params to userData for UI
            if (!this.mesh.userData.params) this.mesh.userData.params = {};
            this.mesh.userData.params.moveDuration = this.moveDuration;
            this.mesh.userData.params.stopDuration = this.stopDuration;
            this.mesh.userData.params.speed = this.speed;
            this.mesh.userData.params.wanderRadius = this.wanderRadius;

            // Also store directly on userData for easier access if needed
            this.mesh.userData.moveDuration = this.moveDuration;
            this.mesh.userData.stopDuration = this.stopDuration;
            this.mesh.userData.speed = this.speed;
            this.mesh.userData.wanderRadius = this.wanderRadius;
        }
    }

    createMesh(params) {
        const group = new THREE.Group();
        group.name = 'CowRoot';

        // Materials
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.5 });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xddddbb, roughness: 0.7 });

        // -- Body Group (Rotates/Bobs) --
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.9; // Legs height
        group.add(bodyGroup);

        // Main Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 1.6);
        const body = new THREE.Mesh(bodyGeo, whiteMat);
        body.castShadow = true;
        body.receiveShadow = true;
        bodyGroup.add(body);

        // Spots
        const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.4, 0.5), blackMat);
        spot1.position.set(0, 0.1, -0.3);
        spot1.castShadow = true;
        bodyGroup.add(spot1);

        const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.3, 0.4), blackMat);
        spot2.position.set(0, -0.2, 0.4);
        spot2.castShadow = true;
        bodyGroup.add(spot2);

        // Head Group
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.5, 0.9);
        bodyGroup.add(headGroup);

        // Head Mesh
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.6);
        const head = new THREE.Mesh(headGeo, whiteMat);
        head.castShadow = true;
        headGroup.add(head);

        // Nose
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.2), pinkMat);
        nose.position.set(0, -0.15, 0.25);
        headGroup.add(nose);

        // Horns
        const hornGeo = new THREE.ConeGeometry(0.04, 0.3, 8);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.2, 0.35, -0.1);
        hornL.rotation.z = 0.3;
        headGroup.add(hornL);

        const hornR = new THREE.Mesh(hornGeo, hornMat);
        hornR.position.set(0.2, 0.35, -0.1);
        hornR.rotation.z = -0.3;
        headGroup.add(hornR);

        // Udder
        const udder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), pinkMat);
        udder.position.set(0, -0.45, -0.2);
        bodyGroup.add(udder);

        // -- Legs --
        this.legGroup = new THREE.Group();
        group.add(this.legGroup);

        const legGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
        legGeo.translate(0, -0.45, 0);

        const createLeg = (x, z) => {
            const leg = new THREE.Mesh(legGeo, whiteMat);
            leg.position.set(x, 0.9, z);
            leg.castShadow = true;
            return leg;
        };

        this.legs = [
            createLeg(-0.3, 0.6),  // Front Left
            createLeg(0.3, 0.6),   // Front Right
            createLeg(-0.3, -0.6), // Back Left
            createLeg(0.3, -0.6)   // Back Right
        ];
        this.legs.forEach(l => this.legGroup.add(l));

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        if (!this.spawnPos) {
            this.spawnPos = this.mesh.position.clone();
        }

        // --- Sync Parameters from UserData (UI) ---
        // Checks both params object and direct userData (safety net)
        const p = this.mesh.userData.params || {};
        this.moveDuration = p.moveDuration ?? this.mesh.userData.moveDuration ?? this.moveDuration;
        this.stopDuration = p.stopDuration ?? this.mesh.userData.stopDuration ?? this.stopDuration;
        this.speed = p.speed ?? this.mesh.userData.speed ?? this.speed;
        this.wanderRadius = p.wanderRadius ?? this.mesh.userData.wanderRadius ?? this.wanderRadius;

        this.timer -= dt;

        if (this.state === 'idle') {
            // Animation
            this.mesh.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.01);
            this.legs.forEach(l => l.rotation.x = THREE.MathUtils.lerp(l.rotation.x, 0, dt * 5));

            if (this.timer <= 0) {
                this.pickNewState();
            }

        } else if (this.state === 'walk') {
            // 1. Move
            const moveDist = this.speed * dt;
            const nextPos = this.mesh.position.clone().addScaledVector(this.currentDir, moveDist);

            // 2. Check Constraints
            let blocked = false;

            // 2a. Wander Radius
            if (nextPos.distanceTo(this.spawnPos) > this.wanderRadius) {
                blocked = true;
                const dirToHome = new THREE.Vector3().subVectors(this.spawnPos, this.mesh.position).normalize();
                this.currentDir.copy(dirToHome);
                this.currentDir.x += (Math.random() - 0.5);
                this.currentDir.z += (Math.random() - 0.5);
                this.currentDir.normalize();
            }

            // 2b. Physical Obstacles
            if (!blocked && window.app && window.app.colliderSystem) {
                const testBox = this.box.clone();
                const offset = new THREE.Vector3().subVectors(nextPos, this.mesh.position);
                testBox.translate(offset);
                testBox.expandByScalar(-0.1);

                const nearby = window.app.colliderSystem.spatialHash.query(nextPos.x, nextPos.z);
                for (const other of nearby) {
                    if (other.mesh === this.mesh) continue;
                    if (other.box && testBox.intersectsBox(other.box)) {
                        blocked = true;
                        break;
                    }
                }
            }

            if (blocked) {
                this.timer = 0;
                this.state = 'idle';
            } else {
                this.mesh.position.copy(nextPos);
                this.mesh.position.y = 0; // Terrain snap

                const lookTarget = this.mesh.position.clone().add(this.currentDir);
                this.mesh.lookAt(lookTarget);

                const walkTime = Date.now() * 0.005 * this.speed;
                this.legs[0].rotation.x = Math.sin(walkTime) * 0.5; // FL
                this.legs[1].rotation.x = Math.cos(walkTime) * 0.5; // FR
                this.legs[2].rotation.x = Math.cos(walkTime) * 0.5; // BL
                this.legs[3].rotation.x = Math.sin(walkTime) * 0.5; // BR
            }

            if (this.timer <= 0) {
                this.pickNewState();
            }
        }

        // Update Physics
        if (this.box && window.app && window.app.colliderSystem) {
             window.app.colliderSystem.updateBody(this.mesh);
        }
    }

    pickNewState() {
        if (this.state === 'idle') {
            this.state = 'walk';
            this.timer = this.moveDuration * (0.8 + Math.random() * 0.4);

            const angle = Math.random() * Math.PI * 2;
            this.currentDir.set(Math.sin(angle), 0, Math.cos(angle));
        } else {
            this.state = 'idle';
            this.timer = this.stopDuration * (0.8 + Math.random() * 0.4);
        }
    }

    serialize() {
        const data = super.serialize();
        // Ensure params are up to date
        data.params.moveDuration = this.moveDuration;
        data.params.stopDuration = this.stopDuration;
        data.params.speed = this.speed;
        data.params.wanderRadius = this.wanderRadius;
        return data;
    }
}

EntityRegistry.register('bird', BirdEntity);
EntityRegistry.register('cow', CowEntity);
