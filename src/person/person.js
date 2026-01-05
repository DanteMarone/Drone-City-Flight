// src/person/person.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const PLAYER_ASSETS = {
    model: new URL('./player_male01.fbx', import.meta.url),
    idle: new URL('./player_male01_idle.fbx', import.meta.url),
    standingJump: new URL('./player_male01_standing_jump.fbx', import.meta.url),
    movingJump: new URL('./player_male01_moving_jump.fbx', import.meta.url),
    walking: new URL('./player_male01_walking.fbx', import.meta.url)
};

const PLAYER_ANIMATION_KEYS = {
    idle: 'idle',
    standingJump: 'standingJump',
    movingJump: 'movingJump',
    walking: 'walking'
};

const PLAYER_MODEL_SCALE = 0.01;
const MOVE_INPUT_THRESHOLD = 0.1;
const ACTION_FADE_DURATION = 0.2;

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();

        this.mesh = new THREE.Group();
        this.mesh.name = 'player';
        this.scene.add(this.mesh);

        this.mixer = null;
        this.actions = {};
        this.activeAction = null;
        this.jumpAction = null;
        this.wasJumpPressed = false;
        this.loadError = null;

        this._loadModel();
    }

    async _loadModel() {
        const loader = new FBXLoader();

        try {
            const [model, idleFbx, standingJumpFbx, movingJumpFbx, walkingFbx] = await Promise.all([
                loader.loadAsync(PLAYER_ASSETS.model),
                loader.loadAsync(PLAYER_ASSETS.idle),
                loader.loadAsync(PLAYER_ASSETS.standingJump),
                loader.loadAsync(PLAYER_ASSETS.movingJump),
                loader.loadAsync(PLAYER_ASSETS.walking)
            ]);

            model.scale.setScalar(PLAYER_MODEL_SCALE);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.mesh.add(model);

            this.mixer = new THREE.AnimationMixer(model);
            this.mixer.addEventListener('finished', (event) => {
                if (event.action === this.jumpAction) {
                    this.jumpAction = null;
                }
            });

            this.actions[PLAYER_ANIMATION_KEYS.idle] = this._createLoopingAction(idleFbx.animations[0]);
            this.actions[PLAYER_ANIMATION_KEYS.standingJump] = this._createJumpAction(standingJumpFbx.animations[0]);
            this.actions[PLAYER_ANIMATION_KEYS.movingJump] = this._createJumpAction(movingJumpFbx.animations[0]);
            this.actions[PLAYER_ANIMATION_KEYS.walking] = this._createLoopingAction(walkingFbx.animations[0]);

            this._fadeToAction(this.actions[PLAYER_ANIMATION_KEYS.idle], 0);
        } catch (error) {
            this.loadError = error;
        }
    }

    _createLoopingAction(clip) {
        if (!clip || !this.mixer) return null;
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.enabled = true;
        return action;
    }

    _createJumpAction(clip) {
        if (!clip || !this.mixer) return null;
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.enabled = true;
        return action;
    }

    _fadeToAction(action, duration = ACTION_FADE_DURATION) {
        if (!action || this.activeAction === action) return;

        if (this.activeAction) {
            this.activeAction.fadeOut(duration);
        }

        action.reset();
        action.fadeIn(duration);
        action.play();
        this.activeAction = action;
    }

    _playJumpAction(action) {
        if (!action) return;

        if (this.activeAction && this.activeAction !== action) {
            this.activeAction.fadeOut(ACTION_FADE_DURATION);
        }

        action.reset();
        action.fadeIn(ACTION_FADE_DURATION);
        action.play();
        this.activeAction = action;
        this.jumpAction = action;
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        this._updatePhysics(dt, input, colliderSystem, dynamicColliders);
        this._syncMesh();
        this._updateAnimation(dt, input);
    }

    _updatePhysics(dt, input, colliderSystem, dynamicColliders) {
        const conf = CONFIG.PERSON;
        const turn = input.yaw || 0;
        this.yaw += turn * conf.TURN_SPEED * dt;

        const moveInput = new THREE.Vector3(input.x || 0, 0, input.z || 0);
        if (moveInput.lengthSq() > 1) moveInput.normalize();
        moveInput.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        const targetVelocity = moveInput.multiplyScalar(conf.MAX_SPEED);
        this.velocity.x = damp(this.velocity.x, targetVelocity.x, conf.ACCELERATION, dt);
        this.velocity.z = damp(this.velocity.z, targetVelocity.z, conf.ACCELERATION, dt);

        if (this.grounded && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.grounded = false;
        }

        this.velocity.y += conf.GRAVITY * dt;

        this.position.add(this.velocity.clone().multiplyScalar(dt));

        const hits = colliderSystem.checkCollisions(this.position, conf.RADIUS, dynamicColliders);
        this.grounded = false;

        hits.forEach(hit => {
            if (hit.penetration > 0) {
                this.position.add(hit.normal.clone().multiplyScalar(hit.penetration));
                const vDotN = this.velocity.dot(hit.normal);
                if (vDotN < 0) {
                    this.velocity.add(hit.normal.clone().multiplyScalar(-vDotN));
                }
                if (hit.normal.y > 0.5) {
                    this.grounded = true;
                }
            }
        });
    }

    _updateAnimation(dt, input) {
        if (!this.mixer) return;

        this.mixer.update(dt);

        const moveMagnitude = Math.hypot(input.x || 0, input.z || 0);
        const isMoving = moveMagnitude > MOVE_INPUT_THRESHOLD;
        const jumpPressed = !!input.jump;
        const jumpJustPressed = jumpPressed && !this.wasJumpPressed;

        if (this.grounded && jumpJustPressed) {
            const jumpAction = isMoving
                ? this.actions[PLAYER_ANIMATION_KEYS.movingJump]
                : this.actions[PLAYER_ANIMATION_KEYS.standingJump];
            this._playJumpAction(jumpAction);
        }

        this.wasJumpPressed = jumpPressed;

        if (this.jumpAction && this.jumpAction.isRunning()) {
            return;
        }

        if (this.jumpAction && !this.jumpAction.isRunning()) {
            this.jumpAction = null;
        }

        const desiredAction = isMoving
            ? this.actions[PLAYER_ANIMATION_KEYS.walking]
            : this.actions[PLAYER_ANIMATION_KEYS.idle];

        this._fadeToAction(desiredAction);
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
