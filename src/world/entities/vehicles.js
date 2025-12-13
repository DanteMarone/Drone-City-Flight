import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { createSedanGeometry, createBicycleMesh } from '../../world/carGeometries.js';
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

            // Create Waypoint Visuals
            this._createWaypointVisuals();
        }
    }

    _createWaypointVisuals() {
        if (!this.mesh) return;

        let visualGroup = this.mesh.getObjectByName('waypointVisuals');
        if (!visualGroup) {
            visualGroup = new THREE.Group();
            visualGroup.name = 'waypointVisuals';
            visualGroup.visible = false;
            this.mesh.add(visualGroup);
        }

        // Clear existing
        while(visualGroup.children.length > 0) {
            visualGroup.remove(visualGroup.children[0]);
        }

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.waypoints.forEach(pos => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(pos);
            orb.userData = { type: 'waypoint', isHelper: true };
            visualGroup.add(orb);
        });

        if (this.waypoints.length > 0) {
            const points = [new THREE.Vector3(0, 0, 0), ...this.waypoints];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            visualGroup.add(line);
        }
    }

    update(dt) {
        if (!this.mesh || this.waypoints.length === 0) return;

        const path = [new THREE.Vector3(0, 0, 0), ...this.waypoints];
        if (path.length < 2) return;

        // Separate visuals from model
        const visualGroup = this.mesh.getObjectByName('waypointVisuals');
        const modelChildren = this.mesh.children.filter(child => child !== visualGroup);
        if (modelChildren.length === 0) return;

        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) targetIdx = 1;

        if (targetIdx < 0) targetIdx = 0;
        if (targetIdx >= path.length) targetIdx = path.length - 1;

        const targetPos = path[targetIdx];
        const currentPos = modelChildren[0].position.clone();

        const speed = Math.max(0, this.baseSpeed);
        const dist = currentPos.distanceTo(targetPos);
        const moveAmount = speed * dt;

        if (dist > moveAmount) {
            const dir = targetPos.clone().sub(currentPos).normalize();
            const moveVec = dir.multiplyScalar(moveAmount);
            modelChildren.forEach(child => child.position.add(moveVec));

            const worldTarget = this.mesh.localToWorld(targetPos.clone());
            modelChildren.forEach(child => child.lookAt(worldTarget));
        } else {
            modelChildren.forEach(child => child.position.copy(targetPos));
            if (targetIdx < path.length - 1) {
                this.mesh.userData.targetIndex++;
            } else {
                this.mesh.userData.targetIndex = 0;
            }
        }

        // Update Box for Physics (Broadphase Hack)
        // See World._updateManualCars logic in original code
        if (this.box) {
            this.box.makeEmpty();
            modelChildren.forEach(child => {
                child.updateMatrixWorld();
                this.box.expandByObject(child);
            });
            // We assume World will handle SpatialHash updates if needed,
            // or we rely on the large initial box approach.
        }
    }

    serialize() {
        const data = super.serialize();
        // Include waypoints from userData (which might be edited)
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
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.6 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        group.add(body);
        group.add(details);
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
        return createBicycleMesh();
    }
}

EntityRegistry.register('car', CarEntity);
EntityRegistry.register('bicycle', BicycleEntity);
