// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();

export class Person {
    constructor(scene) {
        this.scene = scene;

        this.position = new THREE.Vector3(0, CONFIG.PERSON.RADIUS, 0);
        this.velocity = new THREE.Vector3();
        this.yaw = 0;
        this.onGround = false;
        this.radius = CONFIG.PERSON.RADIUS;

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.6 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.7 });

        const bodyHeight = CONFIG.PERSON.HEIGHT * 0.6;
        const bodyGeo = new THREE.CylinderGeometry(0.35, 0.4, bodyHeight, 10);
        const headGeo = new THREE.SphereGeometry(0.28, 12, 12);

        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        body.position.y = bodyHeight * 0.5;

        const head = new THREE.Mesh(headGeo, headMat);
        head.castShadow = true;
        head.position.y = bodyHeight + 0.35;

        this.mesh.add(body, head);
    }

    update(dt, input, physics, dynamicColliders = []) {
        this._applyMovement(dt, input);
        this._applyGravity(dt, input);
        this.position.addScaledVector(this.velocity, dt);

        const hits = physics.resolveCollisions(this, dynamicColliders, {
            restitution: 0,
            friction: 0.75
        });

        this.onGround = hits.some(hit => hit.normal.y > 0.6);
        if (this.onGround && this.velocity.y < 0) {
            this.velocity.y = 0;
        }

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }

    _applyMovement(dt, input) {
        const forwardInput = -input.z;
        const rightInput = input.x;

        _forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        _right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        _move.set(0, 0, 0)
            .addScaledVector(_forward, forwardInput)
            .addScaledVector(_right, rightInput);

        if (_move.lengthSq() > 1) {
            _move.normalize();
        }

        const desiredVelocity = _move.multiplyScalar(CONFIG.PERSON.SPEED);
        const lerpFactor = Math.min(1, CONFIG.PERSON.ACCELERATION * dt);
        this.velocity.x += (desiredVelocity.x - this.velocity.x) * lerpFactor;
        this.velocity.z += (desiredVelocity.z - this.velocity.z) * lerpFactor;

        this.yaw += input.yaw * CONFIG.PERSON.TURN_SPEED * dt;
    }

    _applyGravity(dt, input) {
        if (input.jump && this.onGround) {
            this.velocity.y = CONFIG.PERSON.JUMP_SPEED;
            this.onGround = false;
        }

        this.velocity.y += CONFIG.WORLD.GRAVITY * dt;
    }
}
