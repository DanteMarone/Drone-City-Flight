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
    }

    postInit() {
        if (this.mesh) {
            this.mesh.userData.waypoints = this.waypoints;
            this.mesh.userData.targetIndex = 1;
            this.mesh.userData.isVehicle = true;

            // Ping Pong State
            if (this.type === 'pickup') {
                 this.mesh.userData.pingPong = true;
                 this.mesh.userData.reverse = false;
                 this.mesh.userData.waitTimer = 0;
                 // Set default wait time if not exists
                 if (this.mesh.userData.waitTime === undefined) {
                     this.mesh.userData.waitTime = 10;
                 }
            }

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

        const path = [this.mesh.position.clone(), ...this.waypoints];
        if (path.length < 2) return;

        // Ping-Pong Logic: Wait Handling
        if (this.mesh.userData.pingPong && this.mesh.userData.waitTimer > 0) {
            this.mesh.userData.waitTimer -= dt;
            if (this.mesh.userData.waitTimer < 0) this.mesh.userData.waitTimer = 0;
            return; // Waiting
        }

        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) targetIdx = 1;

        // Sanity Check
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
            // Snap
            modelGroup.position.copy(localTarget);

            // Logic for Next Waypoint
            if (this.mesh.userData.pingPong) {
                const isReverse = this.mesh.userData.reverse;

                if (!isReverse) {
                    // Moving Forward (Start -> End)
                    if (targetIdx < path.length - 1) {
                        this.mesh.userData.targetIndex++;
                    } else {
                        // Reached End
                        this.mesh.userData.reverse = true;
                        this.mesh.userData.targetIndex = path.length - 2; // Next target is previous
                        // Wait
                        this.mesh.userData.waitTimer = this.mesh.userData.waitTime || 0;
                    }
                } else {
                    // Moving Backward (End -> Start)
                    if (targetIdx > 0) {
                        this.mesh.userData.targetIndex--;
                    } else {
                        // Reached Start (which is index 0 in path construction, but here path[0] is start position)
                        // Wait, path[0] is the start position.
                        // Actually path is [Pos, W1, W2].
                        // Index 0 is Pos.
                        this.mesh.userData.reverse = false;
                        this.mesh.userData.targetIndex = 1; // Next target is first waypoint
                        // Wait
                        this.mesh.userData.waitTimer = this.mesh.userData.waitTime || 0;
                    }
                }
            } else {
                // Loop Logic (Car/Bicycle)
                if (targetIdx < path.length - 1) {
                    this.mesh.userData.targetIndex++;
                } else {
                    this.mesh.userData.targetIndex = 0;
                }
            }
        }

        // Update Box
        if (this.box) {
            this.box.makeEmpty();
            modelGroup.updateMatrixWorld();
            this.box.expandByObject(modelGroup);
        }
    }

    serialize() {
        const data = super.serialize();
        if (this.mesh && this.mesh.userData.waypoints) {
            data.params.waypoints = this.mesh.userData.waypoints;
        } else {
            data.params.waypoints = this.waypoints;
        }

        if (this.mesh && this.mesh.userData.waitTime !== undefined) {
            data.params.waitTime = this.mesh.userData.waitTime;
        } else if (this.params.waitTime !== undefined) {
             data.params.waitTime = this.params.waitTime;
        }

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
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 1.0; // Slightly slower
        this.params.waitTime = params.waitTime !== undefined ? params.waitTime : 10;
    }

    postInit() {
        super.postInit();
        if (this.mesh) {
            this.mesh.userData.waitTime = this.params.waitTime;
        }
    }

    createMesh(params) {
        const geoData = createPickupGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0044aa, roughness: 0.3, metalness: 0.4 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 });

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
