// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

const _moveInput = new THREE.Vector3();
const _horizontal = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

export class Person {
    constructor(scene) {
        this.scene = scene;

        this.position = new THREE.Vector3(0, CONFIG.PERSON.RADIUS, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.isGrounded = false;

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4e79ff, roughness: 0.6 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffd2a8, roughness: 0.8 });

        const bodyHeight = CONFIG.PERSON.HEIGHT * 0.65;
        const bodyRadius = CONFIG.PERSON.RADIUS * 0.6;
        const bodyGeo = new THREE.CapsuleGeometry(bodyRadius, bodyHeight, 4, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;

        const headGeo = new THREE.SphereGeometry(bodyRadius * 0.75, 16, 16);
        const head = new THREE.Mesh(headGeo, headMat);
        head.castShadow = true;
        head.position.y = bodyHeight * 0.5 + bodyRadius * 0.75;

        this.mesh.add(body, head);
    }

    update(dt, input, physics, dynamicColliders) {
        this._updateMovement(dt, input);

        const hits = physics.resolveCollisionsFor(this, dynamicColliders, {
            radius: CONFIG.PERSON.RADIUS,
            restitution: CONFIG.PERSON.COLLISION_RESTITUTION,
            friction: CONFIG.PERSON.COLLISION_FRICTION
        });

        this._updateGroundState(hits);
        this._syncMesh();
    }

    _updateMovement(dt, input) {
        const conf = CONFIG.PERSON;

        this.yaw += input.yaw * conf.TURN_SPEED * dt;

        _moveInput.set(input.x, 0, input.z);
        if (_moveInput.lengthSq() > 1) _moveInput.normalize();
        _moveInput.applyAxisAngle(_upAxis, this.yaw);
        _moveInput.multiplyScalar(conf.ACCELERATION);

        this.velocity.addScaledVector(_moveInput, dt);

        _horizontal.set(this.velocity.x, 0, this.velocity.z);
        const horizontalSpeed = _horizontal.length();
        if (horizontalSpeed > conf.MAX_SPEED) {
            _horizontal.setLength(conf.MAX_SPEED);
            this.velocity.x = _horizontal.x;
            this.velocity.z = _horizontal.z;
        }

        this.velocity.x -= this.velocity.x * conf.DRAG * dt;
        this.velocity.z -= this.velocity.z * conf.DRAG * dt;

        if (input.jump && this.isGrounded) {
            this.velocity.y = conf.JUMP_SPEED;
            this.isGrounded = false;
        }

        this.velocity.y += conf.GRAVITY * dt;
        this.position.addScaledVector(this.velocity, dt);
    }

    _updateGroundState(hits) {
        const groundThreshold = CONFIG.PERSON.GROUND_NORMAL_THRESHOLD;
        this.isGrounded = hits.some(hit => hit.normal.y >= groundThreshold);

        if (this.isGrounded && this.velocity.y < 0) {
            this.velocity.y = 0;
        }
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
