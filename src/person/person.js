import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, CONFIG.PERSON.RADIUS, 0);
        this.velocity = new THREE.Vector3();
        this.yaw = 0;
        this.onGround = false;

        this.mesh = new THREE.Group();
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    _buildMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x5b7cff, roughness: 0.6, metalness: 0.1 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffd4b0, roughness: 0.8, metalness: 0.05 });

        const radius = CONFIG.PERSON.RADIUS;
        const height = CONFIG.PERSON.HEIGHT;
        const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(radius, height, 6, 12), bodyMat);
        capsule.castShadow = true;
        capsule.receiveShadow = true;

        const meshOffset = height / 2 + radius;
        capsule.position.y = meshOffset;

        const head = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.6, 16, 16), headMat);
        head.position.y = meshOffset + radius * 0.9;
        head.castShadow = true;

        this.mesh.add(capsule, head);
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    reset(position, yaw = 0) {
        this.position.copy(position);
        this.position.y = Math.max(this.position.y, CONFIG.PERSON.RADIUS);
        this.velocity.set(0, 0, 0);
        this.yaw = yaw;
        this.onGround = false;
        this._syncMesh();
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        const conf = CONFIG.PERSON;

        this.yaw += input.yaw * conf.TURN_SPEED * dt;

        const moveInput = new THREE.Vector3(input.x, 0, input.z);
        if (moveInput.lengthSq() > 1) moveInput.normalize();
        moveInput.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        const targetVel = moveInput.multiplyScalar(conf.SPEED);
        this.velocity.x = damp(this.velocity.x, targetVel.x, conf.ACCELERATION, dt);
        this.velocity.z = damp(this.velocity.z, targetVel.z, conf.ACCELERATION, dt);

        if (this.onGround && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.onGround = false;
        }

        this.velocity.y += conf.GRAVITY * dt;

        const frameMove = this.velocity.clone().multiplyScalar(dt);
        this.position.add(frameMove);

        this._resolveCollisions(colliderSystem, dynamicColliders);
        this._syncMesh();
    }

    getSpeed() {
        return Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    }

    _resolveCollisions(colliderSystem, dynamicColliders) {
        const radius = CONFIG.PERSON.RADIUS;
        const hits = colliderSystem.checkCollisions(this.position, radius, dynamicColliders);

        this.onGround = false;

        hits.forEach(hit => {
            if (hit.penetration > 0) {
                this.position.addScaledVector(hit.normal, hit.penetration);
                const vDot = this.velocity.dot(hit.normal);
                if (vDot < 0) {
                    this.velocity.addScaledVector(hit.normal, -vDot);
                }
                if (hit.normal.y > 0.5) {
                    this.onGround = true;
                }
            }
        });
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
