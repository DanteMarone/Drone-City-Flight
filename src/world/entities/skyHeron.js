import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class SkyHeronEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'skyHeron';

        if (params.y === undefined) this.position.y = 6;

        this.waypoints = params.waypoints || [];
        this.currentWaypointIndex = 0;

        this.perchDuration = params.perchDuration ?? 6;
        this.flyDuration = params.flyDuration ?? 10;
        this.flightSpeed = params.flightSpeed ?? 4.5;

        this.state = 'perched';
        this.stateTimer = 0;
        this.animTime = Math.random() * 10;

        this._target = new THREE.Vector3();
        this._dir = new THREE.Vector3();
        this._perchPos = new THREE.Vector3();
    }

    static get displayName() { return 'Sky Heron'; }

    postInit() {
        this._perchPos.copy(this.mesh.position);
        this.mesh.userData.startPos = this._perchPos.clone();
        this.mesh.userData.waypoints = this.waypoints;
        this.mesh.userData.isVehicle = true;
        this.mesh.userData.perchDuration = this.perchDuration;
        this.mesh.userData.flyDuration = this.flyDuration;
        this.mesh.userData.flightSpeed = this.flightSpeed;
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyGroup = new THREE.Group();
        bodyGroup.name = 'modelGroup';
        group.add(bodyGroup);

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8fd3ff, roughness: 0.5 });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x4d8ccf, roughness: 0.6 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.4 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x2b4c6f, roughness: 0.7 });

        const bodyGeo = new THREE.SphereGeometry(0.32, 16, 12);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.1, 0.8, 1.8);
        body.castShadow = true;
        bodyGroup.add(body);

        const neckGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.4, 10);
        const neck = new THREE.Mesh(neckGeo, bodyMat);
        neck.position.set(0, 0.25, 0.25);
        neck.rotation.x = -0.25;
        neck.castShadow = true;
        bodyGroup.add(neck);

        const headGeo = new THREE.SphereGeometry(0.16, 12, 10);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.48, 0.38);
        head.castShadow = true;
        bodyGroup.add(head);

        const beakGeo = new THREE.ConeGeometry(0.07, 0.25, 12);
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.position.set(0, 0.48, 0.55);
        beak.rotation.x = Math.PI / 2;
        beak.castShadow = true;
        bodyGroup.add(beak);

        const crestGeo = new THREE.BoxGeometry(0.05, 0.18, 0.05);
        const crest = new THREE.Mesh(crestGeo, accentMat);
        crest.position.set(0, 0.6, 0.32);
        crest.rotation.x = 0.2;
        crest.castShadow = true;
        bodyGroup.add(crest);

        const tailGeo = new THREE.ConeGeometry(0.12, 0.3, 10);
        const tail = new THREE.Mesh(tailGeo, accentMat);
        tail.position.set(0, -0.05, -0.48);
        tail.rotation.x = -Math.PI / 2;
        tail.castShadow = true;
        bodyGroup.add(tail);

        const wingGeo = new THREE.BoxGeometry(0.7, 0.04, 0.25);
        const leftWingPivot = new THREE.Group();
        leftWingPivot.position.set(0.32, 0.05, 0.05);
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(0.35, 0, 0);
        leftWing.castShadow = true;
        leftWingPivot.add(leftWing);
        bodyGroup.add(leftWingPivot);

        const rightWingPivot = new THREE.Group();
        rightWingPivot.position.set(-0.32, 0.05, 0.05);
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.set(-0.35, 0, 0);
        rightWing.castShadow = true;
        rightWingPivot.add(rightWing);
        bodyGroup.add(rightWingPivot);

        const bellyGeo = new THREE.SphereGeometry(0.22, 12, 10);
        const belly = new THREE.Mesh(bellyGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
        belly.position.set(0, -0.08, 0.08);
        belly.scale.set(0.9, 0.8, 1.4);
        belly.castShadow = true;
        bodyGroup.add(belly);

        group.userData.leftWingPivot = leftWingPivot;
        group.userData.rightWingPivot = rightWingPivot;
        group.userData.head = head;
        group.userData.bodyGroup = bodyGroup;

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        const waypoints = this.mesh.userData.waypoints || this.waypoints;
        const hasWaypoints = Array.isArray(waypoints) && waypoints.length > 0;

        this.perchDuration = this.mesh.userData.perchDuration ?? this.perchDuration;
        this.flyDuration = this.mesh.userData.flyDuration ?? this.flyDuration;
        this.flightSpeed = this.mesh.userData.flightSpeed ?? this.flightSpeed;

        this.stateTimer += dt;
        this.animTime += dt;

        const leftWing = this.mesh.userData.leftWingPivot;
        const rightWing = this.mesh.userData.rightWingPivot;
        const head = this.mesh.userData.head;

        if (this.state === 'perched') {
            if (hasWaypoints && this.stateTimer >= this.perchDuration) {
                this.state = 'flying';
                this.stateTimer = 0;
            }
            this.mesh.position.copy(this._perchPos);
        } else if (this.state === 'flying') {
            if (!hasWaypoints) {
                this.state = 'perched';
                this.stateTimer = 0;
            } else {
                const wp = waypoints[this.currentWaypointIndex];
                this._target.set(wp.x, wp.y, wp.z);
                const distance = this._moveTowards(this._target, dt, this.flightSpeed);

                if (distance < 0.4) {
                    this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
                }

                if (this.stateTimer >= this.flyDuration) {
                    this.state = 'returning';
                    this.stateTimer = 0;
                }
            }
        } else if (this.state === 'returning') {
            this._target.copy(this._perchPos);
            this._moveTowards(this._target, dt, this.flightSpeed * 0.9);
            if (this.mesh.position.distanceTo(this._perchPos) < 0.3) {
                this.state = 'perched';
                this.stateTimer = 0;
            }
        }

        const flapSpeed = this.state === 'flying' ? 9 : 2.5;
        const flap = Math.sin(this.animTime * flapSpeed) * (this.state === 'flying' ? 0.9 : 0.2);
        if (leftWing && rightWing) {
            leftWing.rotation.z = flap;
            rightWing.rotation.z = -flap;
        }

        if (head) {
            head.position.y = 0.48 + Math.sin(this.animTime * 1.6) * 0.02;
        }

        if (this.state === 'perched') {
            this.mesh.position.y = this._perchPos.y + Math.sin(this.animTime * 1.1) * 0.05;
        }

        if (this.box) {
            this.mesh.updateMatrixWorld(true);
            this.box.setFromObject(this.mesh);
        }
    }

    _moveTowards(target, dt, speed) {
        const distance = this.mesh.position.distanceTo(target);
        if (distance < 0.01) {
            this.mesh.lookAt(target);
            return distance;
        }

        this._dir.subVectors(target, this.mesh.position).normalize();
        this.mesh.position.addScaledVector(this._dir, speed * dt);
        this.mesh.lookAt(target);
        return distance;
    }

    serialize() {
        const data = super.serialize();
        data.params.waypoints = this.mesh.userData.waypoints || this.waypoints;
        data.params.perchDuration = this.mesh.userData.perchDuration ?? this.perchDuration;
        data.params.flyDuration = this.mesh.userData.flyDuration ?? this.flyDuration;
        data.params.flightSpeed = this.mesh.userData.flightSpeed ?? this.flightSpeed;
        return data;
    }
}

EntityRegistry.register('skyHeron', SkyHeronEntity);
