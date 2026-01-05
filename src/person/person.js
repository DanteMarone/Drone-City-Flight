// src/person/person.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const PLAYER_MODEL_URL = new URL('./player_male01.fbx', import.meta.url);
const PLAYER_ANIMATION_URLS = {
    idle: new URL('./player_male01_idle.fbx', import.meta.url),
    walking: new URL('./player_male01_walking.fbx', import.meta.url),
    standingJump: new URL('./player_male01_standing_jump.fbx', import.meta.url),
    movingJump: new URL('./player_male01_moving_jump.fbx', import.meta.url)
};

const PLAYER_TARGET_HEIGHT = 1.75;
const MOVEMENT_EPSILON = 0.01;
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
        this.scene.add(this.mesh);

        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.currentActionName = null;
        this.isMoving = false;
        this.isJumping = false;

        this._loadModel();
    }

    async _loadModel() {
        const loader = new FBXLoader();

        try {
            const baseModel = await this._loadFbx(loader, PLAYER_MODEL_URL);
            this._configureModel(baseModel);
            this.mesh.add(baseModel);

            this.mixer = new THREE.AnimationMixer(baseModel);
            this.mixer.addEventListener('finished', (event) => {
                if (this._isJumpAction(event.action)) {
                    this.isJumping = false;
                }
            });

            const [idleClip, walkingClip, standingJumpClip, movingJumpClip] = await Promise.all([
                this._loadAnimationClip(loader, PLAYER_ANIMATION_URLS.idle),
                this._loadAnimationClip(loader, PLAYER_ANIMATION_URLS.walking),
                this._loadAnimationClip(loader, PLAYER_ANIMATION_URLS.standingJump),
                this._loadAnimationClip(loader, PLAYER_ANIMATION_URLS.movingJump)
            ]);

            this.actions = {
                idle: this._createLoopingAction(idleClip),
                walking: this._createLoopingAction(walkingClip),
                standingJump: this._createJumpAction(standingJumpClip),
                movingJump: this._createJumpAction(movingJumpClip)
            };

            this._playAction('idle', { immediate: true });
        } catch (error) {
            console.error('Failed to load player FBX assets.', error);
        }
    }

    _loadFbx(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url.toString(),
                (object) => resolve(object),
                undefined,
                (err) => reject(err)
            );
        });
    }

    async _loadAnimationClip(loader, url) {
        const animationAsset = await this._loadFbx(loader, url);
        const clip = animationAsset.animations[0];
        if (!clip) {
            throw new Error(`No animation clip found in ${url.toString()}`);
        }
        return clip;
    }

    _configureModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        if (size.y > 0) {
            const scale = PLAYER_TARGET_HEIGHT / size.y;
            model.scale.setScalar(scale);
        }

        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.y = -scaledBox.min.y;
    }

    _createLoopingAction(clip) {
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.enabled = true;
        return action;
    }

    _createJumpAction(clip) {
        const action = this.mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.enabled = true;
        return action;
    }

    _isJumpAction(action) {
        return (
            action === this.actions.standingJump ||
            action === this.actions.movingJump
        );
    }

    _playAction(name, { immediate = false } = {}) {
        const nextAction = this.actions[name];
        if (!nextAction) return;
        if (this.currentActionName === name && !immediate) return;

        if (this.currentAction && this.currentAction !== nextAction) {
            this.currentAction.fadeOut(ACTION_FADE_DURATION);
        }

        nextAction.reset();
        if (immediate) {
            nextAction.fadeIn(0);
        } else {
            nextAction.fadeIn(ACTION_FADE_DURATION);
        }
        nextAction.play();

        this.currentAction = nextAction;
        this.currentActionName = name;
    }

    _triggerJumpAction(isMoving) {
        const actionName = isMoving ? 'movingJump' : 'standingJump';
        if (!this.actions[actionName]) return;
        this.isJumping = true;
        this._playAction(actionName, { immediate: true });
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        this._updatePhysics(dt, input, colliderSystem, dynamicColliders);
        this._updateAnimation(dt);
        this._syncMesh();
    }

    _updatePhysics(dt, input, colliderSystem, dynamicColliders) {
        const conf = CONFIG.PERSON;
        const turn = input.yaw || 0;
        this.yaw += turn * conf.TURN_SPEED * dt;

        const moveInput = new THREE.Vector3(input.x || 0, 0, input.z || 0);
        if (moveInput.lengthSq() > 1) moveInput.normalize();
        moveInput.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        this.isMoving = moveInput.lengthSq() > MOVEMENT_EPSILON;

        const targetVelocity = moveInput.multiplyScalar(conf.MAX_SPEED);
        this.velocity.x = damp(this.velocity.x, targetVelocity.x, conf.ACCELERATION, dt);
        this.velocity.z = damp(this.velocity.z, targetVelocity.z, conf.ACCELERATION, dt);

        if (this.grounded && input.jump) {
            this.velocity.y = conf.JUMP_SPEED;
            this.grounded = false;
            this._triggerJumpAction(this.isMoving);
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

    _updateAnimation(dt) {
        if (!this.mixer) return;

        this.mixer.update(dt);

        if (this.isJumping || !this.grounded) {
            return;
        }

        if (this.isMoving) {
            this._playAction('walking');
        } else {
            this._playAction('idle');
        }
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
