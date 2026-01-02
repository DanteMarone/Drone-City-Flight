import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();
const _tempVec3 = new THREE.Vector3();
const _tempTarget = new THREE.Vector3();
const _tempNormal = new THREE.Vector3();

const DEFAULTS = {
    detectionRange: 28,
    chaseDistance: 22,
    chaseDuration: 4.5,
    runSpeed: 5.2,
    attackRange: 1.8,
    attackCooldown: 1.5,
    batteryDamage: 8,
    colliderRadius: 0.45,
    pathCellSize: 1.5,
    pathSearchRadius: 12,
    pathRefresh: 0.6
};

export class DroneHunterEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'droneHunter';

        this.detectionRange = params.detectionRange ?? DEFAULTS.detectionRange;
        this.chaseDistance = params.chaseDistance ?? DEFAULTS.chaseDistance;
        this.chaseDuration = params.chaseDuration ?? DEFAULTS.chaseDuration;
        this.runSpeed = params.runSpeed ?? DEFAULTS.runSpeed;
        this.attackRange = params.attackRange ?? DEFAULTS.attackRange;
        this.attackCooldown = params.attackCooldown ?? DEFAULTS.attackCooldown;
        this.batteryDamage = params.batteryDamage ?? DEFAULTS.batteryDamage;
        this.colliderRadius = params.colliderRadius ?? DEFAULTS.colliderRadius;
        this.pathCellSize = params.pathCellSize ?? DEFAULTS.pathCellSize;
        this.pathSearchRadius = params.pathSearchRadius ?? DEFAULTS.pathSearchRadius;
        this.pathRefresh = params.pathRefresh ?? DEFAULTS.pathRefresh;

        this.groundY = params.y ?? 0;
        this.chaseTimer = 0;
        this.pathTimer = 0;
        this.attackTimer = 0;
        this.path = [];
        this.isChasing = false;
        this.isMoving = false;
        this.runPhase = 0;
        this.idlePhase = 0;
        this.lastTargetSample = new THREE.Vector3();
    }

    createMesh(params) {
        const group = new THREE.Group();

        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1b2f6b, roughness: 0.9 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0xb8322b, roughness: 0.85 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffc49a, roughness: 0.7 });
        const gearMat = new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.8 });
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x44ccff,
            emissive: 0x1177aa,
            emissiveIntensity: 0.8
        });

        const legGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 10);
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.7, 12);
        const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);

        const legLeft = new THREE.Mesh(legGeo, pantsMat);
        legLeft.position.set(0.16, 0.35, 0);
        const legRight = legLeft.clone();
        legRight.position.x = -0.16;

        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 0.95;

        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.45;

        const armLeft = new THREE.Mesh(armGeo, shirtMat);
        armLeft.position.set(0.38, 1.05, 0);
        const armRight = armLeft.clone();
        armRight.position.x = -0.38;

        const backpackGeo = new THREE.BoxGeometry(0.35, 0.45, 0.18);
        const backpack = new THREE.Mesh(backpackGeo, gearMat);
        backpack.position.set(0, 1.02, -0.25);

        const visorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14, 1, false, Math.PI * 0.2, Math.PI * 1.6);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.rotation.x = Math.PI / 2;
        visor.position.set(0, 1.47, 0.18);

        const batonGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10);
        const batonMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5, metalness: 0.4 });
        const baton = new THREE.Mesh(batonGeo, batonMat);
        baton.rotation.z = Math.PI / 2;
        baton.position.set(-0.52, 1.08, 0.1);

        group.add(legLeft, legRight, torso, head, armLeft, armRight, backpack, visor, baton);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        group.userData.parts = {
            legLeft,
            legRight,
            armLeft,
            armRight,
            baton
        };

        return group;
    }

    createCollider() {
        if (!this.mesh) return null;
        this.mesh.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(this.mesh);
    }

    update(dt) {
        if (!this.mesh) return;
        if (!window.app || !window.app.drone) return;

        const drone = window.app.drone;
        const dronePos = drone.position;

        _tempVec.set(dronePos.x - this.mesh.position.x, 0, dronePos.z - this.mesh.position.z);
        const horizontalDist = _tempVec.length();

        if (horizontalDist <= this.detectionRange) {
            if (!this.isChasing) {
                this.isChasing = true;
                this.chaseTimer = this.chaseDuration;
                this.pathTimer = 0;
            }
        }

        if (this.isChasing) {
            this.chaseTimer -= dt;
            if (horizontalDist > this.chaseDistance || this.chaseTimer <= 0) {
                this.isChasing = false;
                this.path = [];
            }
        }

        if (this.isChasing) {
            this._updatePath(dt, dronePos);
            this._moveAlongPath(dt, dronePos);
        } else {
            this._idleSway(dt);
        }

        this._attemptAttack(dt, dronePos);
        this._animateRunCycle(dt);

        if (window.app.colliderSystem && this.box) {
            this.box.setFromObject(this.mesh);
            window.app.colliderSystem.updateBody(this.mesh);
        }
    }

    _updatePath(dt, targetPos) {
        this.pathTimer -= dt;
        const targetMoved = this.lastTargetSample.distanceToSquared(targetPos) > this.pathCellSize * this.pathCellSize;

        if (this.pathTimer <= 0 || targetMoved) {
            this.pathTimer = this.pathRefresh;
            this.lastTargetSample.copy(targetPos);
            const start = this.mesh.position;
            this.path = this._findPath(start, targetPos);
        }
    }

    _findPath(start, target) {
        if (!window.app || !window.app.colliderSystem) return [];

        const cellSize = this.pathCellSize;
        const radius = this.pathSearchRadius;
        const originX = start.x - radius;
        const originZ = start.z - radius;
        const size = Math.ceil((radius * 2) / cellSize) + 1;

        const startIx = Math.round((start.x - originX) / cellSize);
        const startIz = Math.round((start.z - originZ) / cellSize);
        const targetIx = Math.round((target.x - originX) / cellSize);
        const targetIz = Math.round((target.z - originZ) / cellSize);

        if (startIx < 0 || startIz < 0 || startIx >= size || startIz >= size) return [];
        if (targetIx < 0 || targetIz < 0 || targetIx >= size || targetIz >= size) return [];

        const nodeCount = size * size;
        if (nodeCount > 576) return [];

        const gScore = new Array(nodeCount).fill(Infinity);
        const fScore = new Array(nodeCount).fill(Infinity);
        const cameFrom = new Array(nodeCount).fill(-1);
        const openSet = [];
        const openFlags = new Array(nodeCount).fill(false);
        const blockedCache = new Array(nodeCount).fill(null);

        const startIndex = startIx + startIz * size;
        const targetIndex = targetIx + targetIz * size;

        gScore[startIndex] = 0;
        fScore[startIndex] = this._heuristic(startIx, startIz, targetIx, targetIz);
        openSet.push(startIndex);
        openFlags[startIndex] = true;

        const neighbors = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        while (openSet.length > 0) {
            let currentIndex = openSet[0];
            let currentScore = fScore[currentIndex];
            let currentPos = 0;

            for (let i = 1; i < openSet.length; i++) {
                const idx = openSet[i];
                if (fScore[idx] < currentScore) {
                    currentScore = fScore[idx];
                    currentIndex = idx;
                    currentPos = i;
                }
            }

            openSet.splice(currentPos, 1);
            openFlags[currentIndex] = false;

            if (currentIndex === targetIndex) {
                return this._reconstructPath(cameFrom, currentIndex, originX, originZ, cellSize, size);
            }

            const cx = currentIndex % size;
            const cz = Math.floor(currentIndex / size);

            for (const [dx, dz] of neighbors) {
                const nx = cx + dx;
                const nz = cz + dz;
                if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue;

                const neighborIndex = nx + nz * size;
                const blocked = this._isBlocked(nx, nz, originX, originZ, cellSize, blockedCache, size);
                if (blocked) continue;

                const tentative = gScore[currentIndex] + 1;
                if (tentative < gScore[neighborIndex]) {
                    cameFrom[neighborIndex] = currentIndex;
                    gScore[neighborIndex] = tentative;
                    fScore[neighborIndex] = tentative + this._heuristic(nx, nz, targetIx, targetIz);
                    if (!openFlags[neighborIndex]) {
                        openFlags[neighborIndex] = true;
                        openSet.push(neighborIndex);
                    }
                }
            }
        }

        return [];
    }

    _isBlocked(ix, iz, originX, originZ, cellSize, blockedCache, size) {
        const index = ix + iz * size;
        if (blockedCache[index] !== null) return blockedCache[index];

        const x = originX + ix * cellSize;
        const z = originZ + iz * cellSize;
        const probe = _tempVec2.set(x, this.colliderRadius + 0.1, z);

        const hits = window.app.colliderSystem.checkCollisions(probe, this.colliderRadius);
        const blocked = hits.some(hit => hit.object !== this && hit.object?.mesh !== this.mesh && hit.object?.type !== 'ground');
        blockedCache[index] = blocked;
        return blocked;
    }

    _heuristic(ax, az, bx, bz) {
        return Math.abs(ax - bx) + Math.abs(az - bz);
    }

    _reconstructPath(cameFrom, currentIndex, originX, originZ, cellSize, size) {
        const points = [];
        let current = currentIndex;
        while (current !== -1) {
            const x = originX + (current % size) * cellSize;
            const z = originZ + Math.floor(current / size) * cellSize;
            points.push(new THREE.Vector3(x, this.groundY, z));
            current = cameFrom[current];
        }

        points.reverse();
        points.shift();
        return points;
    }

    _moveAlongPath(dt, targetPos) {
        this.isMoving = false;
        let target = targetPos;
        if (this.path.length > 0) {
            target = this.path[0];
        }

        _tempTarget.set(target.x, this.groundY, target.z);
        _tempVec.subVectors(_tempTarget, this.mesh.position);
        _tempVec.y = 0;
        const dist = _tempVec.length();
        if (dist < 0.05) {
            if (this.path.length > 0) this.path.shift();
            return;
        }

        _tempVec.normalize();
        const moveDist = Math.min(dist, this.runSpeed * dt);
        const nextPos = _tempVec2.copy(this.mesh.position).addScaledVector(_tempVec, moveDist);
        nextPos.y = this.groundY;

        if (this._hasObstacle(nextPos)) {
            this._attemptSlide(nextPos, _tempVec, moveDist);
            this.pathTimer = 0;
            return;
        }

        this.mesh.position.copy(nextPos);
        this.mesh.lookAt(this.mesh.position.clone().add(_tempVec));
        this.isMoving = true;

        if (this.path.length > 0 && dist < this.pathCellSize * 0.5) {
            this.path.shift();
        }
    }

    _hasObstacle(position) {
        if (!window.app || !window.app.colliderSystem) return false;
        const hits = window.app.colliderSystem.checkCollisions(position, this.colliderRadius);
        return hits.some(hit => hit.object !== this && hit.object?.mesh !== this.mesh && hit.object?.type !== 'ground');
    }

    _attemptSlide(nextPos, dir, moveDist) {
        const hits = window.app.colliderSystem.checkCollisions(nextPos, this.colliderRadius);
        if (hits.length === 0) return;

        const hit = hits.find(candidate => candidate.object !== this && candidate.object?.mesh !== this.mesh && candidate.object?.type !== 'ground');
        if (!hit) return;

        _tempNormal.copy(hit.normal);
        _tempVec3.copy(dir).sub(_tempNormal.multiplyScalar(dir.dot(_tempNormal))).normalize();
        if (_tempVec3.lengthSq() < 0.01) return;

        const slidePos = _tempVec2.copy(this.mesh.position).addScaledVector(_tempVec3, moveDist);
        slidePos.y = this.groundY;
        if (!this._hasObstacle(slidePos)) {
            this.mesh.position.copy(slidePos);
            this.mesh.lookAt(this.mesh.position.clone().add(_tempVec3));
            this.isMoving = true;
        }
    }

    _attemptAttack(dt, targetPos) {
        this.attackTimer -= dt;
        if (this.attackTimer > 0) return;

        _tempVec.set(targetPos.x - this.mesh.position.x, 0, targetPos.z - this.mesh.position.z);
        const dist = _tempVec.length();
        if (dist > this.attackRange) return;

        this.attackTimer = this.attackCooldown;
        if (window.app.audio) window.app.audio.playImpact();
        if (window.app.particles) window.app.particles.emit(targetPos, 6, 0xff4444);

        if (window.app.drone && window.app.drone.battery) {
            window.app.drone.battery.current -= this.batteryDamage;
            if (window.app.drone.battery.current < 0) window.app.drone.battery.current = 0;
        }
    }

    _idleSway(dt) {
        this.idlePhase += dt * 1.5;
        const sway = Math.sin(this.idlePhase) * 0.05;
        this.mesh.rotation.y = this.rotation.y + sway;
    }

    _animateRunCycle(dt) {
        const parts = this.mesh.userData.parts;
        if (!parts) return;

        const isMoving = this.isChasing && this.isMoving;
        const speed = isMoving ? this.runSpeed : 0.5;
        this.runPhase += dt * speed;

        const swing = Math.sin(this.runPhase * 3) * (isMoving ? 0.6 : 0.1);
        const counter = Math.cos(this.runPhase * 3) * (isMoving ? 0.6 : 0.1);

        parts.legLeft.rotation.x = swing;
        parts.legRight.rotation.x = -swing;
        parts.armLeft.rotation.x = -counter;
        parts.armRight.rotation.x = counter;
        parts.baton.rotation.y = counter * 0.5;
    }

    static get displayName() {
        return 'Drone Hunter';
    }
}

EntityRegistry.register('droneHunter', DroneHunterEntity);
