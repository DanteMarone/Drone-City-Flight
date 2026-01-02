// src/player/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

const UP = new THREE.Vector3(0, 1, 0);

export class Person {
    constructor(scene) {
        this.scene = scene;

        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.isGrounded = false;
        this.life = CONFIG.PERSON.LIFE_MAX;
        this.tilt = { pitch: 0, roll: 0 };

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b6fdb, roughness: 0.6 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf2d7c9, roughness: 0.5 });

        const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.9, 6, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        body.receiveShadow = true;

        const headGeo = new THREE.SphereGeometry(0.2, 16, 12);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5;
        head.castShadow = true;

        this.mesh.add(body, head);
    }

    getColliderPosition() {
        const colliderPos = this.position.clone();
        colliderPos.y += CONFIG.PERSON.RADIUS;
        return colliderPos;
    }

    update(dt, input) {
        this._updateMovement(dt, input);
        this._applyTransform();
    }

    _updateMovement(dt, input) {
        const conf = CONFIG.PERSON;

        this.yaw += input.yaw * conf.YAW_SPEED * dt;

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, this.yaw);

        const moveInput = forward.multiplyScalar(-input.z).add(right.multiplyScalar(input.x));
        if (moveInput.lengthSq() > 0) {
            moveInput.normalize();
        }

        const accel = moveInput.multiplyScalar(conf.ACCELERATION);
        this.velocity.x += accel.x * dt;
        this.velocity.z += accel.z * dt;

        const horizontal = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        const horizSpeed = horizontal.length();
        const maxSpeed = conf.MAX_SPEED;
        if (horizSpeed > maxSpeed) {
            horizontal.multiplyScalar(maxSpeed / horizSpeed);
            this.velocity.x = horizontal.x;
            this.velocity.z = horizontal.z;
        }

        if (moveInput.lengthSq() === 0) {
            const decel = conf.DECELERATION * dt;
            if (horizSpeed > decel) {
                horizontal.multiplyScalar((horizSpeed - decel) / horizSpeed);
                this.velocity.x = horizontal.x;
                this.velocity.z = horizontal.z;
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }
        }

        if (this.isGrounded && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.isGrounded = false;
        }

        this.velocity.y += conf.GRAVITY * dt;

        this.position.addScaledVector(this.velocity, dt);
    }

    applyCollision(hit) {
        if (hit.penetration > 0) {
            this.position.add(hit.normal.clone().multiplyScalar(hit.penetration));

            if (hit.normal.y > CONFIG.PERSON.GROUND_NORMAL_MIN) {
                this.isGrounded = true;
                this.velocity.y = Math.max(0, this.velocity.y);
            } else {
                const vDotN = this.velocity.dot(hit.normal);
                if (vDotN < 0) {
                    const response = hit.normal.clone().multiplyScalar(vDotN);
                    this.velocity.sub(response);
                }
            }
        }
    }

    resetGrounded() {
        this.isGrounded = false;
    }

    _applyTransform() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
