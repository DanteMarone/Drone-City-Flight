import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { createSedanGeometry, createBicycleMesh, createPickupGeometry } from '../../world/carGeometries.js';
import { CONFIG } from '../../config.js';

export class VehicleEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.waypoints = (params.waypoints || []).map(w => new THREE.Vector3(w.x, w.y, w.z));
        this.currentWaypointIndex = 0;
        this.baseSpeed = 0;

        // Movement state
        this.reverse = false;
        this.isWaiting = false;
        this.waitTimer = 0;

        // Default Settings (can be overridden by subclasses or params)
        this.movementMode = params.movementMode || 'loop'; // 'loop' or 'ping-pong'
        this.waitTime = params.waitTime !== undefined ? params.waitTime : 0;
    }

    postInit() {
        if (this.mesh) {
            this.mesh.userData.waypoints = this.waypoints;
            this.mesh.userData.targetIndex = 1;
            this.mesh.userData.isVehicle = true;

            // Sync params to userData for persistence/UI
            this.mesh.userData.movementMode = this.movementMode;
            this.mesh.userData.waitTime = this.waitTime;

            this._createWaypointVisuals();
        }
    }

    _createWaypointVisuals() {
        this.waypointGroup = new THREE.Group();
        this.waypointGroup.name = 'waypointVisuals_WorldSpace';
        this.waypointGroup.visible = false;

        this.mesh.userData.waypointGroup = this.waypointGroup;

        this._refreshWaypointVisuals();
    }

    _refreshWaypointVisuals() {
        if (!this.waypointGroup) return;

        while(this.waypointGroup.children.length > 0) {
            this.waypointGroup.remove(this.waypointGroup.children[0]);
        }

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.waypoints.forEach((pos, i) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(pos);
            orb.userData = { type: 'waypoint', isHelper: true, index: i, vehicle: this.mesh };
            this.waypointGroup.add(orb);
        });

        if (this.waypoints.length > 0) {
            const points = [this.mesh.position.clone(), ...this.waypoints];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            this.waypointGroup.add(line);
        }
    }

    update(dt) {
        if (!this.mesh) return;

        const modelGroup = this.mesh.getObjectByName('modelGroup');
        if (!modelGroup) return;

        // Sync properties from userData (in case UI changed them)
        if (this.mesh.userData.waitTime !== undefined) this.waitTime = this.mesh.userData.waitTime;
        if (this.mesh.userData.movementMode !== undefined) this.movementMode = this.mesh.userData.movementMode;

        // Path: [Start (Mesh Pos), Waypoint 1, Waypoint 2, ...]
        // Note: The mesh position (Start) is static. The modelGroup moves relative to it.
        const path = [this.mesh.position.clone(), ...this.waypoints];
        if (path.length < 2) return;

        // Handle Waiting
        if (this.isWaiting) {
            this.waitTimer -= dt;
            if (this.waitTimer <= 0) {
                this.isWaiting = false;
                this._advanceTarget(path.length);
            }
            return; // Don't move while waiting
        }

        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) {
             targetIdx = 1;
             this.mesh.userData.targetIndex = 1;
        }

        // Safety check
        if (targetIdx < 0) targetIdx = 0;
        if (targetIdx >= path.length) targetIdx = path.length - 1;

        const targetPos = path[targetIdx];

        // Convert Target (World) to Local Space of Vehicle Mesh (Parent)
        const localTarget = this.mesh.worldToLocal(targetPos.clone());
        const currentLocal = modelGroup.position.clone();

        const speed = Math.max(0, this.baseSpeed);
        const dist = currentLocal.distanceTo(localTarget);
        const moveAmount = speed * dt;

        if (dist > moveAmount) {
            const dir = localTarget.sub(currentLocal).normalize();
            // Move in Local Space
            const moveVec = dir.multiplyScalar(moveAmount);
            modelGroup.position.add(moveVec);

            // Rotation: Look at Target (World)
            modelGroup.lookAt(targetPos);

        } else {
            // Snap to target
            modelGroup.position.copy(localTarget);

            // Reached target, decide next step
            this._handleWaypointReached(path.length);
        }

        // Update Box
        if (this.box) {
            this.box.makeEmpty();
            modelGroup.updateMatrixWorld();
            this.box.expandByObject(modelGroup);
        }
    }

    _handleWaypointReached(pathLength) {
        if (this.movementMode === 'ping-pong') {
            const currentIndex = this.mesh.userData.targetIndex;

            // Check if at ends
            const atEnd = (currentIndex === pathLength - 1);
            const atStart = (currentIndex === 0);

            if (atEnd || atStart) {
                // Wait logic
                if (this.waitTime > 0) {
                    this.isWaiting = true;
                    this.waitTimer = this.waitTime;
                    // We toggle reverse state NOW so that after waiting, we move correctly
                    if (atEnd) this.reverse = true;
                    if (atStart) this.reverse = false;
                } else {
                    // No wait, just turn around
                    if (atEnd) this.reverse = true;
                    if (atStart) this.reverse = false;
                    this._advanceTarget(pathLength);
                }
            } else {
                // Intermediate node, just continue
                this._advanceTarget(pathLength);
            }
        } else {
            // Default Loop Mode
            this._advanceTarget(pathLength);
        }
    }

    _advanceTarget(pathLength) {
        let current = this.mesh.userData.targetIndex;

        if (this.movementMode === 'ping-pong') {
            if (this.reverse) {
                current--;
            } else {
                current++;
            }
            // Clamp (shouldn't strictly be needed if logic is correct, but safe)
            if (current < 0) current = 1; // Should not go below 0, but if we do, go to 1?
            // Actually if we are at 0 and reverse is false, we go to 1.
            // If we are at Length-1 and reverse is true, we go to Length-2.
        } else {
            // Loop
            current++;
            if (current >= pathLength) {
                current = 0;
            }
        }

        this.mesh.userData.targetIndex = current;
    }

    serialize() {
        const data = super.serialize();
        if (this.mesh && this.mesh.userData.waypoints) {
            data.params.waypoints = this.mesh.userData.waypoints;
        } else {
            data.params.waypoints = this.waypoints;
        }
        // Save state
        data.params.waitTime = this.waitTime;
        data.params.movementMode = this.movementMode;
        return data;
    }
}

export class CarEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'car';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 0.5;
    }

    createMesh(params) {
        const geoData = createSedanGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.6 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        modelGroup.add(body);
        modelGroup.add(details);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }
}

export class BicycleEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'bicycle';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) / 2;
    }

    createMesh(params) {
        const partsGroup = createBicycleMesh();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        modelGroup.add(partsGroup);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }
}

export class PickupEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'pickup';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 1.0; // Slightly slower than sedan?

        // Pickup Defaults
        this.movementMode = 'ping-pong';
        this.waitTime = params.waitTime !== undefined ? params.waitTime : 10;
    }

    createMesh(params) {
        const geoData = createPickupGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.4 }); // Red
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        modelGroup.add(body);
        modelGroup.add(details);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }
}

EntityRegistry.register('car', CarEntity);
EntityRegistry.register('bicycle', BicycleEntity);
EntityRegistry.register('pickup', PickupEntity);
