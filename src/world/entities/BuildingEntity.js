import * as THREE from 'three';
import { BaseEntity } from './BaseEntity.js';

export class BuildingEntity extends BaseEntity {
    applyDefaults() {
        super.applyDefaults();
        this.applyShadowDefaults();
    }

    applyShadowDefaults() {
        if (!this.mesh) return;
        this.mesh.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
    }

    clampDimension(value, fallback) {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
    }

    createCollider() {
        const collider = super.createCollider();
        if (collider) {
            collider.type = this.type;
        }
        return collider;
    }
}

export class VehicleEntity extends BaseEntity {
    constructor(context, params = {}) {
        super(context, params);
        this.waypoints = this.validateWaypoints(params.waypoints || []);
    }

    applyDefaults() {
        super.applyDefaults();
        if (this.mesh) {
            this.mesh.userData.params = this.serializeParams();
        }
        this.applyShadowDefaults();
        this.attachWaypointData();
    }

    applyShadowDefaults() {
        if (!this.mesh) return;
        this.mesh.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
    }

    attachWaypointData() {
        if (!this.mesh) return;
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.currentWaypointIndex = 0;
        this.mesh.userData.movingForward = true;
        this._createWaypointVisuals(this.mesh, this.waypoints);
    }

    validateWaypoints(waypoints) {
        return waypoints.map(w => new THREE.Vector3(w.x ?? 0, w.y ?? 0, w.z ?? 0));
    }

    serializeParams() {
        return {
            ...this.params,
            waypoints: this.waypoints.map(w => ({ x: w.x, y: w.y, z: w.z }))
        };
    }

    _createWaypointVisuals(group, waypoints) {
        if (!group) return;
        let visualGroup = group.getObjectByName('waypointVisuals');
        if (!visualGroup) {
            visualGroup = new THREE.Group();
            visualGroup.name = 'waypointVisuals';
            visualGroup.visible = false;
            group.add(visualGroup);
        }

        while (visualGroup.children.length > 0) {
            visualGroup.remove(visualGroup.children[0]);
        }

        if (waypoints.length === 0) return;

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        waypoints.forEach(pos => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(pos);
            orb.userData = { type: 'waypoint', isHelper: true };
            visualGroup.add(orb);
        });

        const points = [new THREE.Vector3(0, 0, 0), ...waypoints];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const line = new THREE.Line(geometry, material);
        line.name = 'pathLine';
        visualGroup.add(line);
    }
}

export class CreatureEntity extends BaseEntity {
    applyDefaults() {
        super.applyDefaults();
        this.applyShadowDefaults();
    }

    applyShadowDefaults() {
        if (!this.mesh) return;
        this.mesh.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
            }
        });
    }
}
