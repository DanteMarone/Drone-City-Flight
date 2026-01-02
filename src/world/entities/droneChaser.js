import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec3A = new THREE.Vector3();
const _tempVec3B = new THREE.Vector3();
const _tempVec3C = new THREE.Vector3();
const _tempVec3D = new THREE.Vector3();
const _tempAxis = new THREE.Vector3(0, 1, 0);

const RUN_STYLES = [
    { suit: 0x283047, accent: 0xff3b3b, skin: 0xffd7c2, visor: 0x66ccff },
    { suit: 0x2a4f36, accent: 0xffaa00, skin: 0xf1c27d, visor: 0x66ff99 },
    { suit: 0x3b3b3b, accent: 0xff6666, skin: 0xe0ac69, visor: 0xff66cc },
    { suit: 0x1c2b3a, accent: 0x6bffad, skin: 0xffdbac, visor: 0x88aaff }
];

export class DroneChaserEntity extends BaseEntity {
    constructor(params = {}) {
        if (params.style === undefined) params.style = Math.floor(Math.random() * RUN_STYLES.length);
        if (params.speed === undefined) params.speed = 2.6;
        if (params.detectionRange === undefined) params.detectionRange = 14;
        if (params.chaseDuration === undefined) params.chaseDuration = 3.5;
        if (params.attackRange === undefined) params.attackRange = 1.6;
        if (params.attackInterval === undefined) params.attackInterval = 1.2;

        super(params);
        this.type = 'droneChaser';
        this.parts = {};
        this.radius = 0.45;
        this._time = 0;
        this._chaseTimer = 0;
        this._attackCooldown = 0;
        this._collisionOffset = new THREE.Vector3(0, this.radius, 0);
        this._bestDir = new THREE.Vector3();
    }

    createMesh(params) {
        const style = RUN_STYLES[(params.style ?? 0) % RUN_STYLES.length];
        const group = new THREE.Group();

        const suitMat = new THREE.MeshStandardMaterial({ color: style.suit, roughness: 0.7 });
        const accentMat = new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.6 });
        const skinMat = new THREE.MeshStandardMaterial({ color: style.skin, roughness: 0.5 });

        const legsGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
        const leftLeg = new THREE.Mesh(legsGeo, suitMat);
        leftLeg.position.set(0.14, 0.3, 0);
        const rightLeg = new THREE.Mesh(legsGeo, suitMat);
        rightLeg.position.set(-0.14, 0.3, 0);
        group.add(leftLeg, rightLeg);

        const torsoGeo = new THREE.BoxGeometry(0.52, 0.7, 0.28);
        const torso = new THREE.Mesh(torsoGeo, suitMat);
        torso.position.set(0, 0.95, 0);
        group.add(torso);

        const beltGeo = new THREE.BoxGeometry(0.5, 0.12, 0.3);
        const belt = new THREE.Mesh(beltGeo, accentMat);
        belt.position.set(0, 0.65, 0);
        group.add(belt);

        const headGeo = new THREE.SphereGeometry(0.23, 16, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.set(0, 1.45, 0);
        group.add(head);

        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 128;
        faceCanvas.height = 128;
        const ctx = faceCanvas.getContext('2d');
        const skinColor = new THREE.Color(style.skin);
        ctx.fillStyle = `#${skinColor.getHexString()}`;
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#111111';
        ctx.fillRect(36, 54, 16, 10);
        ctx.fillRect(76, 54, 16, 10);
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(38, 88);
        ctx.lineTo(90, 88);
        ctx.stroke();

        const faceTex = new THREE.CanvasTexture(faceCanvas);
        faceTex.colorSpace = THREE.SRGBColorSpace;
        head.material = head.material.clone();
        head.material.map = faceTex;
        head.material.needsUpdate = true;
        head.rotation.y = Math.PI;

        const visorGeo = new THREE.BoxGeometry(0.3, 0.12, 0.18);
        const visorMat = new THREE.MeshStandardMaterial({
            color: style.visor,
            emissive: style.visor,
            emissiveIntensity: 1.3
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.45, 0.2);
        group.add(visor);

        const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
        const leftArm = new THREE.Mesh(armGeo, accentMat);
        leftArm.position.set(0.38, 1.05, 0);
        const rightArm = new THREE.Mesh(armGeo, accentMat);
        rightArm.position.set(-0.38, 1.05, 0);
        group.add(leftArm, rightArm);

        const packGeo = new THREE.BoxGeometry(0.34, 0.4, 0.18);
        const packMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5,
            emissive: style.accent,
            emissiveIntensity: 0.6
        });
        const backpack = new THREE.Mesh(packGeo, packMat);
        backpack.position.set(0, 1.02, -0.22);
        group.add(backpack);

        const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
        const antenna = new THREE.Mesh(antennaGeo, accentMat);
        antenna.position.set(0.12, 1.4, -0.28);
        group.add(antenna);

        const beaconGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: style.accent,
            emissive: style.accent,
            emissiveIntensity: 1.2
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0.12, 1.55, -0.28);
        group.add(beacon);

        group.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });

        this.parts.leftLeg = leftLeg;
        this.parts.rightLeg = rightLeg;
        this.parts.leftArm = leftArm;
        this.parts.rightArm = rightArm;
        this.parts.visor = visor;
        this.parts.beacon = beacon;

        return group;
    }

    update(dt) {
        if (!this.mesh || !window.app || !window.app.drone) return;

        this._time += dt;
        const drone = window.app.drone;

        _tempVec3A.set(drone.position.x - this.mesh.position.x, 0, drone.position.z - this.mesh.position.z);
        const flatDist = _tempVec3A.length();

        const detectionRange = parseFloat(this.params.detectionRange) || 14;
        const chaseDuration = parseFloat(this.params.chaseDuration) || 3.5;
        const attackRange = parseFloat(this.params.attackRange) || 1.6;
        const attackInterval = parseFloat(this.params.attackInterval) || 1.2;
        const speed = parseFloat(this.params.speed) || 2.6;

        if (flatDist <= detectionRange) {
            this._chaseTimer = chaseDuration;
        } else {
            this._chaseTimer = Math.max(0, this._chaseTimer - dt);
        }

        if (this._attackCooldown > 0) this._attackCooldown -= dt;

        if (this._chaseTimer > 0 && flatDist > 0.2) {
            const desiredDir = _tempVec3A.normalize();
            const steeringDir = this._chooseSteering(desiredDir);
            this.mesh.position.addScaledVector(steeringDir, speed * dt);
            this.mesh.position.y = 0;
            this._resolveCollisions();

            if (steeringDir.lengthSq() > 0.001) {
                _tempVec3B.copy(this.mesh.position).add(steeringDir);
                this.mesh.lookAt(_tempVec3B.x, this.mesh.position.y, _tempVec3B.z);
            }

            const stride = Math.sin(this._time * 9) * 0.6;
            this.parts.leftLeg.rotation.x = stride;
            this.parts.rightLeg.rotation.x = -stride;
            this.parts.leftArm.rotation.x = -stride * 0.8;
            this.parts.rightArm.rotation.x = stride * 0.8;

            if (flatDist <= attackRange && this._attackCooldown <= 0) {
                this._attackDrone(drone);
                this._attackCooldown = attackInterval;
            }
        } else {
            const idleSwing = Math.sin(this._time * 3) * 0.15;
            this.parts.leftLeg.rotation.x = idleSwing;
            this.parts.rightLeg.rotation.x = -idleSwing;
            this.parts.leftArm.rotation.x = -idleSwing;
            this.parts.rightArm.rotation.x = idleSwing;
        }

        if (this.parts.beacon) {
            const pulse = 1 + Math.sin(this._time * 6) * 0.3;
            this.parts.beacon.scale.setScalar(pulse);
        }
    }

    _chooseSteering(desiredDir) {
        const colliderSystem = window.app.colliderSystem;
        if (!colliderSystem) return desiredDir;

        const probeDistance = this.radius + 0.6;
        const angleOffsets = [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5];
        const bestDir = this._bestDir;
        bestDir.copy(desiredDir);
        let bestScore = Infinity;

        for (const angle of angleOffsets) {
            _tempVec3C.copy(desiredDir).applyAxisAngle(_tempAxis, angle);
            _tempVec3D.copy(this.mesh.position).addScaledVector(_tempVec3C, probeDistance);
            _tempVec3D.add(this._collisionOffset);
            const hits = colliderSystem.checkCollisions(_tempVec3D, this.radius);
            const penalty = hits.length * 10 + Math.abs(angle);
            if (penalty < bestScore) {
                bestScore = penalty;
                bestDir.copy(_tempVec3C);
            }
        }

        return bestDir.normalize();
    }

    _resolveCollisions() {
        const colliderSystem = window.app.colliderSystem;
        if (!colliderSystem) return;

        _tempVec3B.copy(this.mesh.position).add(this._collisionOffset);
        const hits = colliderSystem.checkCollisions(_tempVec3B, this.radius);

        for (const hit of hits) {
            if (hit.penetration > 0) {
                _tempVec3C.copy(hit.normal).multiplyScalar(hit.penetration);
                _tempVec3C.y = 0;
                this.mesh.position.add(_tempVec3C);
            }
        }
    }

    _attackDrone(drone) {
        if (window.app.audio) window.app.audio.playImpact();
        if (window.app.particles) window.app.particles.emit(this.mesh.position, 6, 0xff4444);

        if (drone.battery) {
            drone.battery.current = Math.max(0, drone.battery.current - 8);
        }

        const swing = Math.sin(this._time * 14) * 0.4;
        this.parts.leftArm.rotation.x = -1.2 + swing;
        this.parts.rightArm.rotation.x = -1.2 - swing;
    }

    static get displayName() {
        return 'Drone Chaser';
    }
}

EntityRegistry.register('droneChaser', DroneChaserEntity);
