import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class BirdSystem {
    constructor(scene) {
        this.scene = scene;
        this.birds = [];
        this.pigeons = [];
        this.drone = null;

        // Vectors for reuse
        this._vecToDrone = new THREE.Vector3();
        this._vecToStart = new THREE.Vector3();
        this._vecToTarget = new THREE.Vector3();

        this._raycaster = new THREE.Raycaster();
        this._downVector = new THREE.Vector3(0, -1, 0);
    }

    setDrone(drone) {
        this.drone = drone;
    }

    add(birdMesh) {
        // Ensure it has required data
        if (!birdMesh.userData.startPos) {
            birdMesh.userData.startPos = birdMesh.position.clone();
        }

        const isPigeon = birdMesh.userData.birdType === 'pigeon';

        const bird = {
            mesh: birdMesh,
            state: isPigeon ? 'CALM' : 'IDLE', // Pigeons use CALM/FLEE_* states
            wings: birdMesh.userData.wings,
            animTime: Math.random() * 10,
            fleeTarget: null,
            apexTarget: null,
            cruiseTarget: null,
            landingTarget: null
        };

        if (isPigeon) {
            this.pigeons.push(bird);
        } else {
            this.birds.push(bird);
        }
    }

    remove(birdMesh) {
        const idx = this.birds.findIndex(b => b.mesh === birdMesh);
        if (idx !== -1) this.birds.splice(idx, 1);

        const pIdx = this.pigeons.findIndex(b => b.mesh === birdMesh);
        if (pIdx !== -1) this.pigeons.splice(pIdx, 1);
    }

    clear() {
        this.birds = [];
        this.pigeons = [];
    }

    update(dt) {
        if (!this.drone) return;

        const dronePos = this.drone.mesh.position;
        const birdConf = CONFIG.BIRD;
        const pigeonConf = CONFIG.PIGEON;

        for (const bird of this.birds) {
            this._updateBird(bird, dt, dronePos, birdConf);
        }

        for (const pigeon of this.pigeons) {
            this._updatePigeon(pigeon, dt, dronePos, pigeonConf);
        }
    }

    _updateBird(bird, dt, dronePos, conf) {
        const mesh = bird.mesh;
        const startPos = mesh.userData.startPos;

        // Distances
        const distToDrone = mesh.position.distanceTo(dronePos);
        const distToStart = mesh.position.distanceTo(startPos);

        // State Transition Logic
        if (bird.state === 'IDLE') {
            if (distToDrone < conf.CHASE_RADIUS) {
                bird.state = 'CHASE';
            } else {
                // Return if drifted (sanity check)
                if (distToStart > 5) bird.state = 'RETURN';
            }
        } else if (bird.state === 'CHASE') {
            if (distToStart > conf.RETURN_RADIUS) {
                bird.state = 'RETURN';
            }
            // Logic for "catching"
            // If very close, maybe just stay there attacking?
            // Spec says "if caught... rapidly consumes battery".
            // It doesn't say "stop chasing".
            // So if > 50m from start, return. Else chase.
        } else if (bird.state === 'RETURN') {
            if (distToStart < 1.0) {
                bird.state = 'IDLE';
            }
        }

        // Movement Logic
        let target = null;
        let speed = conf.SPEED;

        if (bird.state === 'CHASE') {
            target = dronePos;
        } else if (bird.state === 'RETURN') {
            target = startPos;
        } else {
            // IDLE: hover at start
            target = startPos;
            speed = 2.0; // Slow return/idle adjustment
        }

        // Move towards target
        const dir = this._vecToDrone.subVectors(target, mesh.position).normalize();

        // Face target
        if (bird.state !== 'IDLE' || distToStart > 0.1) {
            mesh.lookAt(target);
        }

        // Apply Velocity
        if (mesh.position.distanceTo(target) > 0.5) {
            mesh.position.addScaledVector(dir, speed * dt);
        }

        // Animation (Bounce / Flap)
        bird.animTime += dt * 10; // Flap speed
        if (bird.wings) {
            bird.wings.position.y = 0.1 + Math.sin(bird.animTime) * 0.05;
        }

        // Collision & Attack
        if (bird.state === 'CHASE' && distToDrone < conf.COLLISION_RADIUS) {
            if (this.drone.battery) {
                this.drone.battery.current -= CONFIG.BATTERY.DRAIN_COLLISION * dt;
                if (this.drone.battery.current < 0) this.drone.battery.current = 0;
            }
        }
    }

    _updatePigeon(bird, dt, dronePos, conf) {
        const mesh = bird.mesh;
        const startPos = mesh.userData.startPos;

        const params = mesh.userData.params || {};
        const startleRange = params.startleRange ?? conf.STARTLE_RANGE;
        const fleeDistance = params.fleeDistance ?? conf.FLEE_DISTANCE;

        const distToDrone = mesh.position.distanceTo(dronePos);
        const distToStart = mesh.position.distanceTo(startPos);

        if (bird.state === 'CALM' && distToDrone < startleRange) {
            this._startlePigeon(bird, dronePos, {
                ...conf,
                STARTLE_RANGE: startleRange,
                FLEE_DISTANCE: fleeDistance
            });
        }

        let target = startPos;
        let speed = conf.SPEED;

        if (bird.state === 'CALM') {
            speed = distToStart > 1.0 ? conf.SPEED * 0.6 : conf.SPEED * 0.3;
        } else if (bird.state === 'FLEE_ASCEND') {
            target = bird.apexTarget;
            if (mesh.position.distanceTo(target) < 0.25) {
                bird.state = 'FLEE_CRUISE';
            }
        } else if (bird.state === 'FLEE_CRUISE') {
            target = bird.cruiseTarget;
            if (mesh.position.distanceTo(target) < 0.35) {
                bird.state = 'FLEE_DESCEND';
            }
        } else if (bird.state === 'FLEE_DESCEND') {
            target = bird.landingTarget;
            if (mesh.position.distanceTo(target) < 0.35 || this._isOnSurface(mesh, conf, mesh)) {
                mesh.userData.startPos = bird.landingTarget.clone();
                bird.state = 'CALM';
            }
        }

        this._moveTowards(mesh, target, speed, dt, mesh);

        if (bird.wings) {
            bird.animTime += dt * 9;
            bird.wings.position.y = 0.08 + Math.sin(bird.animTime) * 0.04;
        }
    }

    _startlePigeon(bird, dronePos, conf) {
        const mesh = bird.mesh;
        const startPos = mesh.userData.startPos;
        const awayDir = this._vecToDrone.subVectors(mesh.position, dronePos);
        if (awayDir.lengthSq() === 0) awayDir.set(1, 0, 0);
        awayDir.normalize();

        const baseTarget = startPos.clone().addScaledVector(awayDir, conf.FLEE_DISTANCE);
        baseTarget.y = Math.max(baseTarget.y, 0.5);

        const clearTarget = this._findClearTarget(mesh.position, baseTarget, conf, mesh);
        const apexHeight = Math.max(mesh.position.y + conf.ASCENT_HEIGHT, clearTarget.y + conf.ASCENT_HEIGHT * 0.5);

        const cruise = new THREE.Vector3(clearTarget.x, apexHeight, clearTarget.z);
        const landing = this._findLandingPoint(cruise, conf, mesh);

        bird.apexTarget = new THREE.Vector3(mesh.position.x, apexHeight, mesh.position.z);
        bird.cruiseTarget = cruise;
        bird.landingTarget = landing;
        bird.state = 'FLEE_ASCEND';
    }

    _findLandingPoint(fromPosition, conf, ignoreMesh) {
        const origin = new THREE.Vector3(fromPosition.x, fromPosition.y + conf.ASCENT_HEIGHT, fromPosition.z);
        this._raycaster.set(origin, this._downVector);
        this._raycaster.far = conf.ASCENT_HEIGHT * 2 + 50;

        const hits = this._raycaster.intersectObjects(this.scene.children, true);
        const hit = hits.find(h => !this._isIgnoredObject(h.object, ignoreMesh));

        if (hit) {
            return hit.point.clone();
        }

        // Fallback to ground level if nothing is hit
        const fallback = fromPosition.clone();
        fallback.y = Math.max(0, fromPosition.y - conf.ASCENT_HEIGHT);
        return fallback;
    }

    _findClearTarget(start, desired, conf, ignoreMesh) {
        let target = desired.clone();

        for (let i = 0; i < 3; i++) {
            this._vecToTarget.subVectors(target, start);
            const dist = this._vecToTarget.length();
            if (dist < 0.001) return target.clone();

            this._vecToTarget.normalize();
            this._raycaster.set(start, this._vecToTarget);
            const hits = this._raycaster.intersectObjects(this.scene.children, true);
            const hit = hits.find(h => !this._isIgnoredObject(h.object, ignoreMesh) && h.distance < dist);

            if (!hit) return target;

            target = target.clone();
            target.y += conf.AVOID_STEP;
        }

        return target;
    }

    _isIgnoredObject(object, ignoreMesh) {
        if (!ignoreMesh) return false;
        if (object === ignoreMesh) return true;
        return ignoreMesh.children?.includes(object);
    }

    _moveTowards(mesh, target, speed, dt, ignoreMesh) {
        if (!target) return;
        const distance = mesh.position.distanceTo(target);
        if (distance < 0.05) return;

        const dir = this._vecToTarget.subVectors(target, mesh.position).normalize();
        mesh.lookAt(target);

        const step = speed * dt;
        const maxStep = Math.min(step, distance);

        this._raycaster.set(mesh.position, dir);
        this._raycaster.far = maxStep + 0.1;

        const hits = this._raycaster.intersectObjects(this.scene.children, true);
        const hit = hits.find(h => !this._isIgnoredObject(h.object, ignoreMesh));

        if (hit && hit.distance <= maxStep) {
            const cushion = 0.05;
            const travel = Math.max(0, hit.distance - cushion);
            mesh.position.addScaledVector(dir, travel);
            return;
        }

        mesh.position.addScaledVector(dir, maxStep);
    }

    _isOnSurface(mesh, conf, ignoreMesh) {
        const origin = mesh.position.clone();
        origin.y += 0.2;
        this._raycaster.set(origin, this._downVector);
        this._raycaster.far = 0.4;

        const hits = this._raycaster.intersectObjects(this.scene.children, true);
        const hit = hits.find(h => !this._isIgnoredObject(h.object, ignoreMesh));

        return !!hit;
    }
}
