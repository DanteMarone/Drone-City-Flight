import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class KestrelEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'kestrel';

        if (params.y === undefined) this.position.y = 6;

        this.speed = params.speed ?? 4.5;
        this.waypointRadius = params.waypointRadius ?? 8;
        this.waypoints = (params.waypoints || []).map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
        this.currentWaypointIndex = 0;

        this.state = 'PERCH';
        this.stateTimer = 0;
        this.flightDuration = THREE.MathUtils.randFloat(6, 10);
        this.perchDuration = THREE.MathUtils.randFloat(3, 6);
        this.animTime = Math.random() * Math.PI * 2;

        this.perchPos = this.position.clone();
        this._target = new THREE.Vector3();
        this._direction = new THREE.Vector3();
    }

    static get displayName() { return 'Kestrel'; }

    postInit() {
        this.mesh.userData.startPos = this.perchPos.clone();
        this._ensureWaypoints();
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.isVehicle = true;
    }

    serialize() {
        const data = super.serialize();
        data.params.waypoints = this.mesh.userData.waypoints;
        data.speed = this.speed;
        data.waypointRadius = this.waypointRadius;
        return data;
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7b6a5a, roughness: 0.7 });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x5b4a3f, roughness: 0.8 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xd9c6a1, roughness: 0.6 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.5 });

        const bodyGeo = new THREE.SphereGeometry(0.28, 12, 10);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        const chestGeo = new THREE.SphereGeometry(0.22, 12, 10);
        const chest = new THREE.Mesh(chestGeo, accentMat);
        chest.position.set(0, -0.08, 0.12);
        chest.castShadow = true;
        group.add(chest);

        const headGeo = new THREE.SphereGeometry(0.18, 12, 10);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.12, 0.26);
        head.castShadow = true;
        group.add(head);

        const beakGeo = new THREE.ConeGeometry(0.06, 0.2, 10);
        beakGeo.rotateX(Math.PI / 2);
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.position.set(0, 0.08, 0.42);
        beak.castShadow = true;
        group.add(beak);

        const tailGeo = new THREE.BoxGeometry(0.14, 0.04, 0.32);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(0, 0.04, -0.3);
        tail.castShadow = true;
        group.add(tail);

        const wingGeo = new THREE.BoxGeometry(0.7, 0.04, 0.26);
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(0.38, 0.02, 0);
        leftWing.castShadow = true;

        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.set(-0.38, 0.02, 0);
        rightWing.castShadow = true;

        group.add(leftWing, rightWing);

        group.userData.leftWing = leftWing;
        group.userData.rightWing = rightWing;
        group.userData.head = head;
        group.userData.tail = tail;

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.animTime += dt * 6;
        this.stateTimer += dt;

        const waypoints = this.mesh.userData.waypoints || this.waypoints;

        if (this.state === 'PERCH') {
            const bob = Math.sin(this.animTime * 2.2) * 0.05;
            this.mesh.position.set(this.perchPos.x, this.perchPos.y + bob, this.perchPos.z);

            this._setWingPose(0.35, 0.2);
            this._tiltHead(Math.sin(this.animTime) * 0.15);

            if (this.stateTimer >= this.perchDuration) {
                this.state = 'FLY';
                this.stateTimer = 0;
            }
            return;
        }

        if (this.state === 'FLY') {
            if (!waypoints || waypoints.length === 0) {
                this._ensureWaypoints();
            }

            const target = waypoints[this.currentWaypointIndex] || this.perchPos;
            this._target.set(target.x, target.y, target.z);

            this._moveTowardTarget(dt, this.speed);
            this._setWingPose(0.15, 0.9);
            this._tiltHead(Math.sin(this.animTime * 1.4) * 0.05);

            if (this.mesh.position.distanceTo(this._target) < 0.35) {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
            }

            if (this.stateTimer >= this.flightDuration) {
                this.state = 'RETURN';
                this.stateTimer = 0;
            }
            return;
        }

        if (this.state === 'RETURN') {
            this._target.copy(this.perchPos);
            this._moveTowardTarget(dt, this.speed * 0.85);
            this._setWingPose(0.1, 0.7);

            if (this.mesh.position.distanceTo(this.perchPos) < 0.35) {
                this.mesh.position.copy(this.perchPos);
                this.state = 'PERCH';
                this.stateTimer = 0;
                this.flightDuration = THREE.MathUtils.randFloat(6, 10);
                this.perchDuration = THREE.MathUtils.randFloat(3, 6);
            }
        }
    }

    _ensureWaypoints() {
        if (this.waypoints.length > 0) return;

        const points = [];
        const base = this.perchPos.clone();
        const height = base.y + 2.5;
        const step = Math.PI * 2 / 5;

        for (let i = 0; i < 5; i += 1) {
            const angle = step * i;
            points.push(new THREE.Vector3(
                base.x + Math.cos(angle) * this.waypointRadius,
                height + Math.sin(angle * 2) * 0.8,
                base.z + Math.sin(angle) * this.waypointRadius
            ));
        }

        this.waypoints = points;
        this.mesh.userData.waypoints = points;
    }

    _moveTowardTarget(dt, speed) {
        this._direction.subVectors(this._target, this.mesh.position);
        const distance = this._direction.length();
        if (distance > 0.05) {
            this._direction.normalize();
            this.mesh.position.addScaledVector(this._direction, speed * dt);
            this.mesh.lookAt(this._target);
        }
    }

    _setWingPose(baseAngle, flapAmplitude) {
        const leftWing = this.mesh.userData.leftWing;
        const rightWing = this.mesh.userData.rightWing;
        if (!leftWing || !rightWing) return;

        const flap = Math.sin(this.animTime * 3.5) * flapAmplitude;
        leftWing.rotation.z = baseAngle + flap;
        rightWing.rotation.z = -baseAngle - flap;
    }

    _tiltHead(yawAmount) {
        const head = this.mesh.userData.head;
        if (!head) return;
        head.rotation.y = yawAmount;
    }
}

EntityRegistry.register('kestrel', KestrelEntity);
