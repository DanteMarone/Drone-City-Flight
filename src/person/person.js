// src/person/person.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const PERSON_ASSETS = {
    model: new URL('./player_male01.fbx', import.meta.url).href,
    animations: {
        idle: new URL('./player_male01_idle.fbx', import.meta.url).href,
        standingJump: new URL('./player_male01_standing_jump.fbx', import.meta.url).href,
        movingJump: new URL('./player_male01_moving_jump.fbx', import.meta.url).href,
        walk: new URL('./player_male01_walking.fbx', import.meta.url).href
    }
};

const MODEL_CONFIG = {
    scale: 0.01,
    animationBlend: 0.2,
    movementEpsilon: 0.1
};

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();

        this.mesh = new THREE.Group();
        this.mesh.name = 'Player';
        this.scene.add(this.mesh);

        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.activeAction = null;
        this.activeActionName = null;
        this.isJumping = false;
        this.jumpActionName = null;
        this.wasJumpPressed = false;

        this._loadAssets();
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        this._updatePhysics(dt, input, colliderSystem, dynamicColliders);
        this._updateAnimation(dt, input);
        this._syncMesh();
    }

    _loadAssets() {
        const loader = new FBXLoader();

        const load = async () => {
            try {
                const baseModel = await this._loadFbx(loader, PERSON_ASSETS.model);
                baseModel.scale.setScalar(MODEL_CONFIG.scale);
                this._applyShadows(baseModel);
                this._alignModelToCollider(baseModel);
                this.mesh.add(baseModel);
                this.model = baseModel;

                this.mixer = new THREE.AnimationMixer(baseModel);
                this._attachMixerEvents();

                const animationMap = await this._loadAnimations(loader);
                this._registerActions(animationMap);
                this._fadeToAction('idle', { immediate: true });
            } catch (error) {
                console.error('Person: Failed to load player assets.', error);
            }
        };

        load();
    }

    async _loadAnimations(loader) {
        const entries = Object.entries(PERSON_ASSETS.animations);
        const loaded = await Promise.all(
            entries.map(async ([name, url]) => ({
                name,
                fbx: await this._loadFbx(loader, url)
            }))
        );

        return loaded.reduce((acc, { name, fbx }) => {
            const clip = fbx.animations?.[0];
            if (!clip) {
                console.warn(`Person: Missing animation clip for ${name}.`);
                return acc;
            }
            acc[name] = clip;
            return acc;
        }, {});
    }

    _registerActions(animationMap) {
        if (!this.mixer) return;

        Object.entries(animationMap).forEach(([name, clip]) => {
            const action = this.mixer.clipAction(clip);
            if (name === 'standingJump' || name === 'movingJump') {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
            } else {
                action.setLoop(THREE.LoopRepeat, Infinity);
            }
            this.actions[name] = action;
        });
    }

    _attachMixerEvents() {
        if (!this.mixer) return;

        this.mixer.addEventListener('finished', (event) => {
            if (!this.jumpActionName) return;
            if (event.action === this.actions[this.jumpActionName]) {
                this.isJumping = false;
                this.jumpActionName = null;
            }
        });
    }

    _fadeToAction(name, { immediate = false } = {}) {
        const nextAction = this.actions[name];
        if (!nextAction || this.activeAction === nextAction) return;

        nextAction.reset();
        nextAction.enabled = true;
        nextAction.play();

        if (this.activeAction && !immediate) {
            this.activeAction.crossFadeTo(nextAction, MODEL_CONFIG.animationBlend, false);
        } else if (!immediate) {
            nextAction.fadeIn(MODEL_CONFIG.animationBlend);
        }

        this.activeAction = nextAction;
        this.activeActionName = name;
    }

    _playJump(actionName) {
        const action = this.actions[actionName];
        if (!action) return;

        this.isJumping = true;
        this.jumpActionName = actionName;
        action.reset();
        action.enabled = true;
        action.play();
        this._fadeToAction(actionName, { immediate: false });
    }

    _updateAnimation(dt, input) {
        if (this.mixer) {
            this.mixer.update(dt);
        }

        const movingSpeedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
        const isMoving = movingSpeedSq > MODEL_CONFIG.movementEpsilon * MODEL_CONFIG.movementEpsilon;
        const jumpTriggered = input.jump && !this.wasJumpPressed && this.grounded;

        if (jumpTriggered) {
            const actionName = isMoving ? 'movingJump' : 'standingJump';
            this._playJump(actionName);
        } else if (!this.isJumping) {
            this._fadeToAction(isMoving ? 'walk' : 'idle');
        }

        this.wasJumpPressed = input.jump;
    }

    _loadFbx(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });
    }

    _applyShadows(mesh) {
        mesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    _alignModelToCollider(model) {
        const bounds = new THREE.Box3().setFromObject(model);
        const offset = -CONFIG.PERSON.RADIUS - bounds.min.y;
        model.position.y += offset;
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

        hits.forEach((hit) => {
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

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
