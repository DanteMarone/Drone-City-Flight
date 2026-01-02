// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, CONFIG.PERSON.HEIGHT / 2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.onGround = false;
        this.radius = CONFIG.PERSON.RADIUS;
        this.life = CONFIG.PERSON.MAX_LIFE;

        this.chaseOffset = new THREE.Vector3(
            CONFIG.PERSON.CAMERA_CHASE_OFFSET.x,
            CONFIG.PERSON.CAMERA_CHASE_OFFSET.y,
            CONFIG.PERSON.CAMERA_CHASE_OFFSET.z
        );
        this.fpvOffset = new THREE.Vector3(
            CONFIG.PERSON.CAMERA_FPV_OFFSET.x,
            CONFIG.PERSON.CAMERA_FPV_OFFSET.y,
            CONFIG.PERSON.CAMERA_FPV_OFFSET.z
        );
        this.pivotHeight = CONFIG.PERSON.HEIGHT * 0.6;

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a82f6, roughness: 0.6 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.8 });

        const bodyHeight = CONFIG.PERSON.HEIGHT * 0.9;
        const bodyRadius = CONFIG.PERSON.RADIUS * 0.7;
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(bodyRadius, bodyHeight * 0.6, 4, 8),
            bodyMat
        );
        body.position.y = bodyHeight * 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(bodyRadius * 0.8, 16, 16),
            headMat
        );
        head.position.y = bodyHeight + bodyRadius * 0.6;
        head.castShadow = true;
        this.mesh.add(head);
    }

    reset(position, yaw) {
        this.position.copy(position);
        this.yaw = yaw;
        this.velocity.set(0, 0, 0);
        this.life = CONFIG.PERSON.MAX_LIFE;
        this.onGround = false;
        this._syncMesh();
    }

    update(dt, input, physics, dynamicColliders) {
        const conf = CONFIG.PERSON;

        this.yaw += input.yaw * conf.TURN_SPEED * dt;

        const moveDir = new THREE.Vector3(input.x, 0, input.z);
        if (moveDir.lengthSq() > 1) moveDir.normalize();
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const targetVel = moveDir.multiplyScalar(conf.SPEED);

        this.velocity.x = damp(this.velocity.x, targetVel.x, conf.ACCELERATION, dt);
        this.velocity.z = damp(this.velocity.z, targetVel.z, conf.ACCELERATION, dt);

        if (this.onGround && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.onGround = false;
        }

        this.velocity.y += conf.GRAVITY * dt;
        this.velocity.y = Math.max(this.velocity.y, conf.MAX_FALL_SPEED);

        this.position.addScaledVector(this.velocity, dt);

        this.onGround = false;
        const hits = physics.resolveCollisions(this, dynamicColliders, {
            radius: this.radius,
            restitution: 0.0,
            returnHits: true
        });

        if (hits.length > 0) {
            this.onGround = hits.some(hit => hit.normal.y > 0.5);
            if (this.onGround && this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }

        this._syncMesh();
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
