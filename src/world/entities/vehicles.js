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

        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) targetIdx = 1;

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
            // Three.js Object3D.lookAt(vector) assumes vector is in World Space
            // and handles parent transforms automatically.
            modelGroup.lookAt(targetPos);

        } else {
            // Snap
            modelGroup.position.copy(localTarget);

            if (targetIdx < path.length - 1) {
                this.mesh.userData.targetIndex++;
            } else {
                this.mesh.userData.targetIndex = 0;
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

export class PickupTruckEntity extends CarEntity {
    constructor(params) {
        super(params);
        this.type = 'pickupTruck';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 1.0;

        this.waitTime = params?.waitTime ?? 10;
        this.waitTimer = 0;
        this.direction = 1; // 1 forward, -1 backward
    }

    createMesh(params) {
        const geoData = createPickupGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d5c88, roughness: 0.3, metalness: 0.5 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.85, metalness: 0.2 });

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

    postInit() {
        super.postInit();
        if (this.mesh) {
            this.mesh.userData.waitTime = this.waitTime;
            if (this.mesh.userData.params) {
                this.mesh.userData.params.waitTime = this.waitTime;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        const modelGroup = this.mesh.getObjectByName('modelGroup');
        if (!modelGroup) return;

        const path = [this.mesh.position.clone(), ...this.waypoints];
        if (path.length < 2) return;

        const currentWait = this.mesh.userData.waitTime ?? this.waitTime;
        this.waitTime = currentWait;
        if (this.mesh.userData.params) {
            this.mesh.userData.params.waitTime = currentWait;
        }

        if (this.waitTimer > 0) {
            if (currentWait === 0) {
                this.waitTimer = 0;
            } else {
                this.waitTimer = Math.max(0, Math.min(this.waitTimer, currentWait) - dt);
            }

            if (this.waitTimer > 0) return;
        }

        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) targetIdx = 1;
        targetIdx = THREE.MathUtils.clamp(targetIdx, 0, path.length - 1);

        const targetPos = path[targetIdx];
        const localTarget = this.mesh.worldToLocal(targetPos.clone());
        const currentLocal = modelGroup.position.clone();

        const speed = Math.max(0, this.baseSpeed);
        const dist = currentLocal.distanceTo(localTarget);
        const moveAmount = speed * dt;

        if (dist > moveAmount) {
            const dir = localTarget.sub(currentLocal).normalize();
            const moveVec = dir.multiplyScalar(moveAmount);
            modelGroup.position.add(moveVec);
            modelGroup.lookAt(targetPos);
        } else {
            modelGroup.position.copy(localTarget);

            const atForwardEnd = targetIdx >= path.length - 1;
            const atBackwardEnd = targetIdx <= 0;

            if (atForwardEnd || atBackwardEnd) {
                this.direction *= -1;
                this.waitTimer = Math.max(0, currentWait);
                const nextIdx = THREE.MathUtils.clamp(targetIdx + this.direction, 0, path.length - 1);
                this.mesh.userData.targetIndex = nextIdx;
            } else {
                this.mesh.userData.targetIndex = targetIdx + this.direction;
            }
        }

        if (this.box) {
            this.box.makeEmpty();
            modelGroup.updateMatrixWorld();
            this.box.expandByObject(modelGroup);
        }
    }

    serialize() {
        const data = super.serialize();
        data.params.waitTime = this.mesh?.userData?.waitTime ?? this.waitTime;
        return data;
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

EntityRegistry.register('car', CarEntity);
EntityRegistry.register('pickupTruck', PickupTruckEntity);
EntityRegistry.register('bicycle', BicycleEntity);
