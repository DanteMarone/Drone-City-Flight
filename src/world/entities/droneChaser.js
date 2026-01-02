import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempTarget = new THREE.Vector3();
const _tempDir = new THREE.Vector3();
const _tempCandidate = new THREE.Vector3();
const _tempPos = new THREE.Vector3();
const _tempProbe = new THREE.Vector3();
const _tempCenter = new THREE.Vector3();
const _tempLook = new THREE.Vector3();
const UP_AXIS = new THREE.Vector3(0, 1, 0);

const PATH_ANGLES = [
    0,
    THREE.MathUtils.degToRad(22),
    THREE.MathUtils.degToRad(-22),
    THREE.MathUtils.degToRad(45),
    THREE.MathUtils.degToRad(-45),
    THREE.MathUtils.degToRad(70),
    THREE.MathUtils.degToRad(-70),
    THREE.MathUtils.degToRad(110),
    THREE.MathUtils.degToRad(-110),
    Math.PI
];

export class DroneChaserEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'droneChaser';

        this.moveSpeed = params.moveSpeed ?? 4.2;
        this.aggroRange = params.aggroRange ?? 18;
        this.chaseDuration = params.chaseDuration ?? 6.0;
        this.attackRange = params.attackRange ?? 1.4;
        this.attackDamage = params.attackDamage ?? 12;
        this.attackCooldown = params.attackCooldown ?? 1.2;
        this.pathProbeDistance = params.pathProbeDistance ?? 0.9;
        this.collisionRadius = params.collisionRadius ?? 0.45;
        this.collisionHeight = params.collisionHeight ?? 0.9;

        this._time = Math.random() * 5;
        this._isChasing = false;
        this._chaseTimer = 0;
        this._attackTimer = 0;
        this._baseY = this.position.y;
    }

    createMesh(params) {
        const group = new THREE.Group();

        const jacketColor = params.jacketColor ?? 0x2f3b62;
        const pantsColor = params.pantsColor ?? 0x1b1b1b;
        const accentColor = params.accentColor ?? 0x00e5ff;
        const skinColor = params.skinColor ?? 0xf1c27d;

        const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.8 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9 });
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor });
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.2), pantsMat);
        leftLeg.position.set(0.18, 0.35, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.2), pantsMat);
        rightLeg.position.set(-0.18, 0.35, 0);
        group.add(rightLeg);

        const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), bootMat);
        leftBoot.position.set(0.18, 0.06, 0.08);
        group.add(leftBoot);

        const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), bootMat);
        rightBoot.position.set(-0.18, 0.06, 0.08);
        group.add(rightBoot);

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.28, 0.8, 12), jacketMat);
        torso.position.y = 1.15;
        group.add(torso);

        const harnessMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.25 });
        const harness = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), harnessMat);
        harness.position.set(0, 1.22, 0.28);
        group.add(harness);

        const headMat = skinMat.clone();
        headMat.map = this._createFaceTexture(skinColor, accentColor);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), headMat);
        head.position.y = 1.85;
        head.rotation.y = -Math.PI / 2;
        group.add(head);

        const visorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.4 });
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.05), visorMat);
        visor.position.set(0, 1.88, 0.24);
        group.add(visor);

        const armGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
        const leftArm = new THREE.Mesh(armGeo, jacketMat);
        leftArm.position.set(0.38, 1.35, 0.05);
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, jacketMat);
        rightArm.position.set(-0.38, 1.35, 0.05);
        group.add(rightArm);

        const batonMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 });
        const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 10), batonMat);
        baton.rotation.z = Math.PI / 2;
        baton.position.set(-0.6, 1.25, 0.05);
        group.add(baton);

        const batonTipMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4 });
        const batonTip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 10), batonTipMat);
        batonTip.rotation.z = Math.PI / 2;
        batonTip.position.set(-0.9, 1.25, 0.05);
        group.add(batonTip);

        const packMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.8 });
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.2), packMat);
        pack.position.set(0, 1.2, -0.25);
        group.add(pack);

        const antennaMat = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.6 });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), antennaMat);
        antenna.position.set(0.12, 1.55, -0.32);
        group.add(antenna);

        const antennaOrb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), antennaMat);
        antennaOrb.position.set(0.12, 1.78, -0.32);
        group.add(antennaOrb);

        group.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });

        group.userData.leftLeg = leftLeg;
        group.userData.rightLeg = rightLeg;
        group.userData.leftArm = leftArm;
        group.userData.rightArm = rightArm;
        group.userData.torso = torso;
        group.userData.batonTip = batonTip;
        group.userData.antennaOrb = antennaOrb;

        return group;
    }

    _createFaceTexture(skinColor, accentColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        const skin = new THREE.Color(skinColor);
        ctx.fillStyle = `#${skin.getHexString()}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#111111';
        ctx.fillRect(18, 38, 24, 10);
        ctx.fillRect(54, 38, 24, 10);

        ctx.strokeStyle = '#550000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(48, 70, 18, Math.PI + 0.1, -0.1);
        ctx.stroke();

        ctx.strokeStyle = `#${new THREE.Color(accentColor).getHexString()}`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(12, 20);
        ctx.lineTo(84, 20);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        if (!this.mesh || !window.app?.drone) return;

        this._time += dt;
        this._attackTimer = Math.max(0, this._attackTimer - dt);

        const drone = window.app.drone;
        const pos = this.mesh.position;
        const dx = drone.position.x - pos.x;
        const dz = drone.position.z - pos.z;
        const planarDistance = Math.hypot(dx, dz);

        if (planarDistance <= this.aggroRange) {
            this._isChasing = true;
            this._chaseTimer = this.chaseDuration;
        } else if (this._isChasing) {
            this._chaseTimer -= dt;
            if (this._chaseTimer <= 0) this._isChasing = false;
        }

        if (this._isChasing) {
            this._updateChase(dt, drone, planarDistance);
        } else {
            this._updateIdle(dt);
        }

        this._updateAttack(planarDistance, drone);
        this._updateCollider();
    }

    _updateChase(dt, drone, planarDistance) {
        _tempDir.set(drone.position.x - this.mesh.position.x, 0, drone.position.z - this.mesh.position.z);
        if (_tempDir.lengthSq() > 0.0001) {
            _tempDir.normalize();
        }

        const step = this.moveSpeed * dt;
        const moveDir = this._findPathDirection(_tempDir, step);

        if (moveDir.lengthSq() > 0.0001 && planarDistance > this.attackRange * 0.6) {
            this.mesh.position.addScaledVector(moveDir, step);
            this.mesh.position.y = this._baseY;
            this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            this._animateRun(dt);
        } else {
            this._updateIdle(dt);
        }

        const batonTip = this.mesh.userData.batonTip;
        const antennaOrb = this.mesh.userData.antennaOrb;
        if (batonTip?.material) {
            batonTip.material.emissiveIntensity = 0.9 + Math.sin(this._time * 6) * 0.3;
        }
        if (antennaOrb?.material) {
            antennaOrb.material.emissiveIntensity = 0.8 + Math.sin(this._time * 4) * 0.2;
        }
    }

    _updateIdle(dt) {
        const idleSway = Math.sin(this._time * 1.5) * 0.1;
        const torso = this.mesh.userData.torso;
        if (torso) torso.rotation.z = idleSway * 0.15;

        const leftArm = this.mesh.userData.leftArm;
        const rightArm = this.mesh.userData.rightArm;
        if (leftArm) leftArm.rotation.x = idleSway * 0.2;
        if (rightArm) rightArm.rotation.x = -idleSway * 0.2;

        const leftLeg = this.mesh.userData.leftLeg;
        const rightLeg = this.mesh.userData.rightLeg;
        if (leftLeg) leftLeg.rotation.x = 0;
        if (rightLeg) rightLeg.rotation.x = 0;

        const batonTip = this.mesh.userData.batonTip;
        const antennaOrb = this.mesh.userData.antennaOrb;
        if (batonTip?.material) batonTip.material.emissiveIntensity = 0.25;
        if (antennaOrb?.material) antennaOrb.material.emissiveIntensity = 0.35;

        this.mesh.position.y = this._baseY + Math.sin(this._time * 2.0) * 0.02;
    }

    _animateRun(dt) {
        const cycle = Math.sin(this._time * 8);
        const armSwing = cycle * 0.6;
        const legSwing = -cycle * 0.6;

        const leftArm = this.mesh.userData.leftArm;
        const rightArm = this.mesh.userData.rightArm;
        const leftLeg = this.mesh.userData.leftLeg;
        const rightLeg = this.mesh.userData.rightLeg;
        const torso = this.mesh.userData.torso;

        if (leftArm) leftArm.rotation.x = armSwing;
        if (rightArm) rightArm.rotation.x = -armSwing;
        if (leftLeg) leftLeg.rotation.x = legSwing;
        if (rightLeg) rightLeg.rotation.x = -legSwing;
        if (torso) torso.rotation.x = -0.1;

        this.mesh.position.y = this._baseY + Math.abs(cycle) * 0.04;
    }

    _findPathDirection(desiredDir, step) {
        const probeDistance = Math.max(this.pathProbeDistance, step * 1.2);

        if (!window.app?.colliderSystem) {
            return desiredDir;
        }

        for (const angle of PATH_ANGLES) {
            _tempCandidate.copy(desiredDir).applyAxisAngle(UP_AXIS, angle);
            _tempPos.copy(this.mesh.position).addScaledVector(_tempCandidate, probeDistance);
            _tempProbe.set(_tempPos.x, this._baseY + this.collisionHeight, _tempPos.z);

            if (this._isPathClear(_tempProbe)) {
                return _tempCandidate;
            }
        }

        return _tempTarget.set(0, 0, 0);
    }

    _isPathClear(testPosition) {
        const hits = window.app.colliderSystem.checkCollisions(testPosition, this.collisionRadius);
        return hits.every(hit => hit.object === this || hit.object?.type === 'ground');
    }

    _updateAttack(planarDistance, drone) {
        if (this._attackTimer > 0) return;
        if (planarDistance > this.attackRange) return;
        if (drone.position.y > this._baseY + 2.5) return;

        if (drone.battery) {
            drone.battery.current = Math.max(0, drone.battery.current - this.attackDamage);
        }

        if (window.app?.audio) window.app.audio.playImpact();
        if (window.app?.particles) {
            _tempLook.set(drone.position.x, drone.position.y, drone.position.z);
            window.app.particles.emit(_tempLook, 6, 0x00e5ff);
        }

        this._attackTimer = this.attackCooldown;
    }

    _updateCollider() {
        if (!this.mesh || !this.box) return;

        this.mesh.updateMatrixWorld();
        this.box.setFromObject(this.mesh);

        if (window.app?.colliderSystem) {
            window.app.colliderSystem.updateBody(this.mesh);
        }
    }

    createCollider() {
        const box = new THREE.Box3();
        _tempCenter.set(this.position.x, this.position.y + this.collisionHeight, this.position.z);
        box.setFromCenterAndSize(_tempCenter, new THREE.Vector3(0.9, 2.0, 0.9));
        return box;
    }

    static get displayName() {
        return 'Drone Chaser';
    }
}

EntityRegistry.register('droneChaser', DroneChaserEntity);
