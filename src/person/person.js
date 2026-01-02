// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

const _tempMove = new THREE.Vector3();
const _tempForward = new THREE.Vector3();
const _tempRight = new THREE.Vector3();
const _tempUp = new THREE.Vector3(0, 1, 0);

const PERSON_MESH = {
    bodyRadius: 0.35,
    bodyHeight: 0.9,
    bodyOffsetY: 0.85,
    headRadius: 0.25,
    headOffsetY: 1.7,
    eyeOffsetX: 0.08,
    eyeOffsetY: 1.72,
    eyeOffsetZ: -0.24
};
const INPUT_DEADZONE = 0.01;

export class Person {
    constructor(scene, colliderSystem) {
        this.scene = scene;
        this.colliderSystem = colliderSystem;

        const startHeight = CONFIG.PERSON.HEIGHT * 0.5;
        this.position = new THREE.Vector3(0, startHeight, 0);
        this.velocity = new THREE.Vector3();
        this.yaw = 0;
        this.isGrounded = false;
        this.tilt = { pitch: 0, roll: 0 };

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a7bd5, roughness: 0.7 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.6 });

        const bodyGeo = new THREE.CapsuleGeometry(PERSON_MESH.bodyRadius, PERSON_MESH.bodyHeight, 4, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.receiveShadow = true;
        body.position.y = PERSON_MESH.bodyOffsetY;
        this.mesh.add(body);

        const headGeo = new THREE.SphereGeometry(PERSON_MESH.headRadius, 16, 16);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = PERSON_MESH.headOffsetY;
        head.castShadow = true;
        head.receiveShadow = true;
        this.mesh.add(head);

        const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
        const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
        eyeLeft.position.set(PERSON_MESH.eyeOffsetX, PERSON_MESH.eyeOffsetY, PERSON_MESH.eyeOffsetZ);
        eyeRight.position.set(-PERSON_MESH.eyeOffsetX, PERSON_MESH.eyeOffsetY, PERSON_MESH.eyeOffsetZ);
        this.mesh.add(eyeLeft, eyeRight);
    }

    setPosition(position, yaw = this.yaw) {
        this.position.copy(position);
        this.yaw = yaw;
        this.velocity.set(0, 0, 0);
        this._syncMesh();
    }

    update(dt, input) {
        this._updateMovement(dt, input);
        this._syncMesh();
    }

    _updateMovement(dt, input) {
        const conf = CONFIG.PERSON;
        const gravity = CONFIG.WORLD.GRAVITY;

        this.yaw += input.yaw * conf.TURN_SPEED * dt;

        const moveX = input.x;
        const moveZ = input.z;
        const hasMoveInput = Math.abs(moveX) > INPUT_DEADZONE || Math.abs(moveZ) > INPUT_DEADZONE;

        _tempForward.set(0, 0, -1).applyAxisAngle(_tempUp, this.yaw);
        _tempRight.set(1, 0, 0).applyAxisAngle(_tempUp, this.yaw);

        _tempMove.set(0, 0, 0);
        _tempMove.addScaledVector(_tempForward, -moveZ);
        _tempMove.addScaledVector(_tempRight, moveX);

        if (_tempMove.lengthSq() > 0) {
            _tempMove.normalize();
        }

        const accel = conf.ACCELERATION * (this.isGrounded ? 1 : conf.AIR_CONTROL);
        this.velocity.x += _tempMove.x * accel * dt;
        this.velocity.z += _tempMove.z * accel * dt;

        const maxSpeed = conf.MAX_SPEED;
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (horizontalSpeed > maxSpeed) {
            const scale = maxSpeed / horizontalSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }

        if (this.isGrounded && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.isGrounded = false;
        }

        this.velocity.y += gravity * dt;

        const drag = this.isGrounded ? conf.DRAG : conf.AIR_DRAG;
        this.velocity.x -= this.velocity.x * drag * dt;
        this.velocity.z -= this.velocity.z * drag * dt;

        this.position.addScaledVector(this.velocity, dt);

        this._resolveCollisions();

        if (this.isGrounded && !hasMoveInput) {
            this.velocity.x *= 1 - conf.FRICTION;
            this.velocity.z *= 1 - conf.FRICTION;
        }
    }

    _resolveCollisions() {
        if (!this.colliderSystem) return;

        const conf = CONFIG.PERSON;
        const hits = this.colliderSystem.checkCollisions(this.position, conf.RADIUS);
        let grounded = false;

        hits.forEach(hit => {
            if (hit.penetration > 0) {
                this.position.add(hit.normal.clone().multiplyScalar(hit.penetration));
            }

            const vDotN = this.velocity.dot(hit.normal);
            if (vDotN < 0) {
                this.velocity.addScaledVector(hit.normal, -vDotN);
            }

            if (hit.normal.y >= conf.GROUND_NORMAL_MIN) {
                grounded = true;
                if (this.velocity.y < 0) {
                    this.velocity.y = 0;
                }
            }
        });

        this.isGrounded = grounded;

        if (this.position.y < conf.HEIGHT * 0.5) {
            this.position.y = conf.HEIGHT * 0.5;
            this.velocity.y = Math.max(0, this.velocity.y);
            this.isGrounded = true;
        }
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
