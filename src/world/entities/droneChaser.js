import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec3 = new THREE.Vector3();
const _tempVec3b = new THREE.Vector3();
const _tempDir = new THREE.Vector3();
const _tempTarget = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

const STYLES = [
    { hoodie: 0x2f3b5f, pants: 0x1e1e1e, shoes: 0x111111, skin: 0xe0ac69, visor: 0x88ccff },
    { hoodie: 0x6f2f2f, pants: 0x2d2a2a, shoes: 0x222222, skin: 0xf1c27d, visor: 0xffcc55 },
    { hoodie: 0x2f5f3b, pants: 0x1f2a22, shoes: 0x101010, skin: 0xffdbac, visor: 0x66ffaa },
    { hoodie: 0x3b2f5f, pants: 0x1f1a2a, shoes: 0x0c0c0c, skin: 0x8d5524, visor: 0xaa88ff }
];

export class DroneChaserEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'droneChaser';
        this.styleIndex = params.styleIndex ?? Math.floor(Math.random() * STYLES.length);
        this.detectionRange = params.detectionRange ?? 20;
        this.attackRange = params.attackRange ?? 1.6;
        this.attackDamage = params.attackDamage ?? 8;
        this.attackCooldown = params.attackCooldown ?? 1.2;
        this.chaseDuration = params.chaseDuration ?? 4.5;
        this.maxChaseDistance = params.maxChaseDistance ?? 12;
        this.speed = params.speed ?? 3.2;
        this.returnSpeed = params.returnSpeed ?? 2.4;
        this.turnSpeed = params.turnSpeed ?? 6.5;
        this.collisionRadius = params.collisionRadius ?? 0.45;

        this.state = 'idle';
        this.chaseTimer = 0;
        this.cooldownTimer = 0;
        this.stepTimer = Math.random() * Math.PI * 2;
        this.homePosition = this.position.clone();
    }

    createMesh(params) {
        const style = STYLES[this.styleIndex % STYLES.length];
        const group = new THREE.Group();

        const hoodieMat = new THREE.MeshStandardMaterial({ color: style.hoodie, roughness: 0.8 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.9 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: style.shoes, roughness: 0.9 });
        const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.7 });

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.65, 12), hoodieMat);
        torso.position.y = 1.1;
        group.add(torso);

        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hoodieMat);
        hood.position.set(0, 1.45, -0.05);
        hood.rotation.x = Math.PI;
        group.add(hood);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
        head.position.y = 1.55;
        head.rotation.y = -Math.PI / 2;
        head.material.map = this._createFaceTexture(style.skin, style.visor);
        head.material.map.colorSpace = THREE.SRGBColorSpace;
        group.add(head);

        const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.18), hoodieMat);
        backpack.position.set(0, 1.1, -0.22);
        group.add(backpack);

        const legGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.7, 10);
        const legLeft = new THREE.Mesh(legGeo, pantsMat);
        legLeft.position.set(0.14, 0.4, 0);
        const legRight = new THREE.Mesh(legGeo, pantsMat);
        legRight.position.set(-0.14, 0.4, 0);
        group.add(legLeft, legRight);

        const shoeGeo = new THREE.BoxGeometry(0.18, 0.08, 0.3);
        const shoeLeft = new THREE.Mesh(shoeGeo, shoeMat);
        shoeLeft.position.set(0.14, 0.05, 0.12);
        const shoeRight = new THREE.Mesh(shoeGeo, shoeMat);
        shoeRight.position.set(-0.14, 0.05, 0.12);
        group.add(shoeLeft, shoeRight);

        const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
        const armLeft = new THREE.Mesh(armGeo, hoodieMat);
        armLeft.position.set(0.36, 1.2, 0.1);
        const armRight = new THREE.Mesh(armGeo, hoodieMat);
        armRight.position.set(-0.36, 1.2, 0.1);
        group.add(armLeft, armRight);

        const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), new THREE.MeshStandardMaterial({
            color: style.visor,
            emissive: style.visor,
            emissiveIntensity: 0.6,
            roughness: 0.4
        }));
        baton.position.set(0.45, 1.0, 0.15);
        baton.rotation.z = Math.PI / 2.2;
        group.add(baton);

        group.userData.legLeft = legLeft;
        group.userData.legRight = legRight;
        group.userData.armLeft = armLeft;
        group.userData.armRight = armRight;

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    _createFaceTexture(skinHex, visorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const skin = new THREE.Color(skinHex);
        const visor = new THREE.Color(visorHex);

        ctx.fillStyle = `#${skin.getHexString()}`;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = `#${visor.getHexString()}`;
        ctx.fillRect(22, 52, 84, 22);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(30, 56, 20, 8);

        ctx.strokeStyle = 'rgba(30,30,30,0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(64, 90, 16, 0, Math.PI, false);
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    update(dt) {
        if (!this.mesh || !window.app || !window.app.drone) return;

        const drone = window.app.drone;
        const dronePos = drone.position;
        const currentPos = this.mesh.position;

        if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

        const flatDroneDist = _tempVec3.copy(dronePos).setY(0).distanceTo(_tempVec3b.copy(currentPos).setY(0));
        const distanceFromHome = _tempVec3.copy(currentPos).setY(0).distanceTo(_tempVec3b.copy(this.homePosition).setY(0));

        if (this.state === 'idle') {
            if (flatDroneDist <= this.detectionRange) {
                this.state = 'chasing';
                this.chaseTimer = this.chaseDuration;
            }
        } else if (this.state === 'chasing') {
            this.chaseTimer -= dt;
            if (this.chaseTimer <= 0 || distanceFromHome > this.maxChaseDistance) {
                this.state = 'returning';
            }
        } else if (this.state === 'returning') {
            if (distanceFromHome < 0.4) {
                this.state = 'idle';
            }
        }

        let targetPos = null;
        let moveSpeed = this.speed;

        if (this.state === 'chasing') {
            targetPos = dronePos;
        } else if (this.state === 'returning') {
            targetPos = this.homePosition;
            moveSpeed = this.returnSpeed;
        }

        if (targetPos) {
            _tempTarget.copy(targetPos).setY(currentPos.y);
            const desiredDir = _tempDir.subVectors(_tempTarget, currentPos);
            desiredDir.y = 0;

            if (desiredDir.lengthSq() > 0.0001) {
                desiredDir.normalize();
                const finalDir = this._findClearDirection(desiredDir, moveSpeed, dt);
                if (finalDir) {
                    currentPos.addScaledVector(finalDir, moveSpeed * dt);
                    this._resolveCollisions();
                    this._faceDirection(finalDir, dt);
                }
            }
        }

        if (flatDroneDist <= this.attackRange && this.cooldownTimer <= 0) {
            this._attackDrone(drone);
        }

        this._animateRun(dt, targetPos ? moveSpeed : 0);

        this.mesh.position.y = this.homePosition.y;
        if (this.box) {
            this.mesh.updateMatrixWorld(true);
            this.box.setFromObject(this.mesh);
        }
    }

    _findClearDirection(desiredDir, moveSpeed, dt) {
        if (!window.app || !window.app.colliderSystem) return desiredDir;

        const colliderSystem = window.app.colliderSystem;
        const stepDistance = moveSpeed * dt + this.collisionRadius;
        const angleSteps = [0, 25, -25, 50, -50, 75, -75, 105, -105, 140, -140];

        for (const angleDeg of angleSteps) {
            const angle = THREE.MathUtils.degToRad(angleDeg);
            const candidate = _tempVec3.copy(desiredDir).applyAxisAngle(_up, angle);
            const nextPos = _tempVec3b.copy(this.mesh.position).addScaledVector(candidate, stepDistance);
            const hits = colliderSystem.checkCollisions(nextPos, this.collisionRadius);

            if (hits.length === 0 || hits.every((hit) => hit.object === this)) {
                return candidate;
            }
        }

        return null;
    }

    _resolveCollisions() {
        if (!window.app || !window.app.colliderSystem) return;
        const hits = window.app.colliderSystem.checkCollisions(this.mesh.position, this.collisionRadius);

        hits.forEach((hit) => {
            if (hit.object === this) return;
            this.mesh.position.addScaledVector(hit.normal, hit.penetration + 0.01);
        });
    }

    _faceDirection(dir, dt) {
        const targetRot = Math.atan2(dir.x, dir.z);
        const current = this.mesh.rotation.y;
        const next = THREE.MathUtils.lerpAngle(current, targetRot, Math.min(1, dt * this.turnSpeed));
        this.mesh.rotation.y = next;
    }

    _attackDrone(drone) {
        this.cooldownTimer = this.attackCooldown;
        if (drone.battery) {
            drone.battery.current = Math.max(0, drone.battery.current - this.attackDamage);
        }
        if (window.app.audio) window.app.audio.playImpact();
        if (window.app.particles) {
            window.app.particles.emit(drone.position, 8, 0xff5533);
        }
    }

    _animateRun(dt, speed) {
        const legLeft = this.mesh.userData.legLeft;
        const legRight = this.mesh.userData.legRight;
        const armLeft = this.mesh.userData.armLeft;
        const armRight = this.mesh.userData.armRight;

        if (!legLeft || !legRight || !armLeft || !armRight) return;

        const moving = speed > 0.2;
        const cadence = moving ? speed * 3.2 : 0.8;
        this.stepTimer += dt * cadence;

        const swing = Math.sin(this.stepTimer) * (moving ? 0.6 : 0.1);
        const counterSwing = Math.sin(this.stepTimer + Math.PI) * (moving ? 0.6 : 0.1);

        legLeft.rotation.x = swing;
        legRight.rotation.x = counterSwing;
        armLeft.rotation.x = counterSwing * 0.7;
        armRight.rotation.x = swing * 0.7;
    }

    static get displayName() {
        return 'Drone Chaser';
    }
}

EntityRegistry.register('droneChaser', DroneChaserEntity);
