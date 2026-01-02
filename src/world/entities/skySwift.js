import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const bodyGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.7, 12);
bodyGeo.rotateX(Math.PI / 2);
const headGeo = new THREE.SphereGeometry(0.18, 16, 12);
const beakGeo = new THREE.ConeGeometry(0.06, 0.2, 8);
beakGeo.rotateX(Math.PI / 2);
const wingGeo = new THREE.BoxGeometry(0.9, 0.05, 0.35);
const tailGeo = new THREE.ConeGeometry(0.12, 0.28, 10);
tailGeo.rotateX(-Math.PI / 2);
const crestGeo = new THREE.ConeGeometry(0.05, 0.12, 8);

export class SkySwiftEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'sky_swift';
        if (params.y === undefined) this.position.y = 6;

        this.waypoints = (params.waypoints || []).map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
        this.currentWaypointIndex = 0;
        this.speed = params.speed ?? 5;
        this.hoverRadius = params.hoverRadius ?? 0.25;

        this.animTime = Math.random() * 10;
        this.basePosition = null;
        this.baseRotation = null;

        this._target = new THREE.Vector3();
        this._direction = new THREE.Vector3();
    }

    static get displayName() { return 'Sky Swift'; }

    postInit() {
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.isVehicle = true;
        this.basePosition = this.mesh.position.clone();
        this.baseRotation = this.mesh.rotation.clone();
        this._createWaypointVisuals();
    }

    serialize() {
        const data = super.serialize();
        data.params.waypoints = this.mesh.userData.waypoints;
        data.params.speed = this.speed;
        data.params.hoverRadius = this.hoverRadius;
        return data;
    }

    createMesh() {
        const group = new THREE.Group();
        group.userData.startPos = this.position.clone();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.6 });
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf2e7cf, roughness: 0.7 });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x244466, roughness: 0.65 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf4a552, roughness: 0.4 });

        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        modelGroup.add(body);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), bellyMat);
        belly.position.set(0, -0.08, 0.1);
        belly.castShadow = true;
        modelGroup.add(belly);

        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.1, 0.35);
        head.castShadow = true;
        modelGroup.add(head);

        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.position.set(0, 0.05, 0.52);
        modelGroup.add(beak);

        const crest = new THREE.Mesh(crestGeo, wingMat);
        crest.position.set(0, 0.23, 0.36);
        crest.rotation.x = Math.PI / 2;
        modelGroup.add(crest);

        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-0.45, 0.1, 0.05);
        leftWing.rotation.z = Math.PI / 10;
        leftWing.castShadow = true;
        modelGroup.add(leftWing);

        const rightWing = leftWing.clone();
        rightWing.position.x = 0.45;
        rightWing.rotation.z = -Math.PI / 10;
        modelGroup.add(rightWing);

        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(0, 0.02, -0.35);
        tail.rotation.x = Math.PI / 18;
        modelGroup.add(tail);

        modelGroup.userData.wings = { left: leftWing, right: rightWing };
        modelGroup.userData.head = head;
        modelGroup.userData.tail = tail;

        group.add(modelGroup);
        return group;
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

        while (this.waypointGroup.children.length > 0) {
            this.waypointGroup.remove(this.waypointGroup.children[0]);
        }

        const orbGeo = new THREE.SphereGeometry(0.4, 12, 12);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xbef9ff });

        this.waypoints.forEach((pos, i) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(pos);
            orb.userData = { type: 'waypoint', isHelper: true, index: i, vehicle: this.mesh };
            this.waypointGroup.add(orb);
        });

        if (this.waypoints.length > 0) {
            const points = [this.mesh.position.clone(), ...this.waypoints];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xbef9ff });
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            this.waypointGroup.add(line);
        }
    }

    update(dt) {
        if (!this.mesh) return;

        const modelGroup = this.mesh.getObjectByName('modelGroup');
        if (!modelGroup) return;

        this.animTime += dt;

        const wings = modelGroup.userData.wings;
        const head = modelGroup.userData.head;
        const tail = modelGroup.userData.tail;
        const hasWaypoints = this.waypoints.length > 0;

        if (hasWaypoints) {
            const waypoint = this.waypoints[this.currentWaypointIndex];
            this._target.copy(waypoint);

            if (this.mesh.position.distanceTo(this._target) < 0.6) {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
                this._target.copy(this.waypoints[this.currentWaypointIndex]);
            }

            this._direction.subVectors(this._target, this.mesh.position).normalize();
            this.mesh.position.addScaledVector(this._direction, this.speed * dt);
            this.mesh.lookAt(this._target);

            const flap = Math.sin(this.animTime * 12) * 0.55;
            wings.left.rotation.z = Math.PI / 10 + flap;
            wings.right.rotation.z = -Math.PI / 10 - flap;
            tail.rotation.y = Math.sin(this.animTime * 6) * 0.2;
            head.rotation.x = Math.sin(this.animTime * 4) * 0.1;

            modelGroup.position.y = Math.sin(this.animTime * 4) * 0.06;
            modelGroup.rotation.z = Math.sin(this.animTime * 3) * 0.18;
        } else {
            if (!this.basePosition) {
                this.basePosition = this.mesh.position.clone();
                this.baseRotation = this.mesh.rotation.clone();
            }

            const hoverPhase = this.animTime * 1.4;
            const hoverOffset = Math.sin(hoverPhase) * this.hoverRadius;
            const orbitOffset = Math.cos(hoverPhase) * this.hoverRadius * 0.4;

            this.mesh.position.set(
                this.basePosition.x + orbitOffset,
                this.basePosition.y + hoverOffset,
                this.basePosition.z + Math.sin(hoverPhase * 0.7) * this.hoverRadius * 0.4
            );
            this.mesh.rotation.y = this.baseRotation.y + Math.sin(hoverPhase * 0.6) * 0.4;

            const flap = Math.sin(this.animTime * 7) * 0.35;
            wings.left.rotation.z = Math.PI / 10 + flap;
            wings.right.rotation.z = -Math.PI / 10 - flap;
            tail.rotation.y = Math.sin(this.animTime * 3) * 0.15;
            head.rotation.x = Math.sin(this.animTime * 2) * 0.2;

            modelGroup.position.y = Math.sin(this.animTime * 3) * 0.04;
            modelGroup.rotation.z = Math.sin(this.animTime * 2) * 0.08;
        }
    }
}

EntityRegistry.register('sky_swift', SkySwiftEntity);
