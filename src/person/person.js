// src/person/person.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const PERSON_ASSETS = {
    model: new URL('./player_male01.fbx', import.meta.url),
    animations: {
        idle: new URL('./player_male01_idle.fbx', import.meta.url),
        standingJump: new URL('./player_male01_standing_jump.fbx', import.meta.url),
        movingJump: new URL('./player_male01_moving_jump.fbx', import.meta.url),
        walking: new URL('./player_male01_walking.fbx', import.meta.url)
    }
};

const ANIMATION_FADE_DURATION = 0.15;
const MOVE_INPUT_THRESHOLD = 0.15;
const WALK_SPEED_THRESHOLD = 0.2;
const TARGET_MODEL_HEIGHT = 1.8;

const ANIMATION_CONFIG = {
    idle: { loop: THREE.LoopRepeat, clampWhenFinished: false },
    walking: { loop: THREE.LoopRepeat, clampWhenFinished: false },
    standingJump: { loop: THREE.LoopOnce, clampWhenFinished: true },
    movingJump: { loop: THREE.LoopOnce, clampWhenFinished: true }
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
        this.modelRoot = new THREE.Group();
        this.mesh.add(this.modelRoot);
        this.scene.add(this.mesh);

        this.mixer = null;
        this.actions = {};
        this.activeAction = null;
        this.pendingJumpType = null;
        this.isJumping = false;
        this.jumpActionFinished = false;

        this._loadModel().catch((error) => {
            console.error('Person: Failed to load player assets.', error);
        });
    }

    async _loadModel() {
        const loader = new FBXLoader();

        try {
            const [model, idle, standingJump, movingJump, walking] = await Promise.all([
                this._loadFbx(loader, PERSON_ASSETS.model),
                this._loadFbx(loader, PERSON_ASSETS.animations.idle),
                this._loadFbx(loader, PERSON_ASSETS.animations.standingJump),
                this._loadFbx(loader, PERSON_ASSETS.animations.movingJump),
                this._loadFbx(loader, PERSON_ASSETS.animations.walking)
            ]);

            this._configureModel(model);
            this.modelRoot.add(model);

            this.mixer = new THREE.AnimationMixer(model);
            this.mixer.addEventListener('finished', (event) => {
                const actionName = event.action?.userData?.name;
                if (actionName === 'standingJump' || actionName === 'movingJump') {
                    this.jumpActionFinished = true;
                }
            });

            this._registerAction('idle', idle.animations?.[0]);
            this._registerAction('standingJump', standingJump.animations?.[0]);
            this._registerAction('movingJump', movingJump.animations?.[0]);
            this._registerAction('walking', walking.animations?.[0]);

            this._fadeToAction('idle', 0);
        } catch (error) {
            console.error('Person: Error while configuring FBX assets.', error);
        }
    }

    _loadFbx(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url.href,
                (object) => resolve(object),
                undefined,
                (error) => reject(error)
            );
        });
    }

    _configureModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = new THREE.Vector3();
        initialBox.getSize(initialSize);

        if (initialSize.y > 0) {
            const scale = TARGET_MODEL_HEIGHT / initialSize.y;
            model.scale.setScalar(scale);
        }

        model.updateMatrixWorld(true);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const groundOffset = -scaledBox.min.y;
        model.position.y += groundOffset;
    }

    _registerAction(name, clip) {
        if (!clip || !this.mixer) {
            console.error(`Person: Missing animation clip for ${name}.`);
            return;
        }

        const config = ANIMATION_CONFIG[name];
        const action = this.mixer.clipAction(clip);
        action.userData = { name };
        action.setLoop(config.loop, config.loop === THREE.LoopOnce ? 1 : Infinity);
        action.clampWhenFinished = config.clampWhenFinished;
        this.actions[name] = action;
    }

    _fadeToAction(name, duration) {
        const action = this.actions[name];
        if (!action) return false;

        if (this.activeAction === action) return true;

        if (this.activeAction) {
            this.activeAction.fadeOut(duration);
        }

        action.reset();
        action.fadeIn(duration);
        action.play();

        this.activeAction = action;
        return true;
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

        const targetVelocity = moveInput.multiplyScalar(conf.MAX_SPEED);
        this.velocity.x = damp(this.velocity.x, targetVelocity.x, conf.ACCELERATION, dt);
        this.velocity.z = damp(this.velocity.z, targetVelocity.z, conf.ACCELERATION, dt);

        if (this.grounded && input.jump) {
            const inputMagnitude = Math.hypot(input.x || 0, input.z || 0);
            this.pendingJumpType =
                inputMagnitude > MOVE_INPUT_THRESHOLD ? 'movingJump' : 'standingJump';
            this.isJumping = true;
            this.jumpActionFinished = false;

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

    _updateAnimation(dt) {
        if (!this.mixer) return;

        if (this.pendingJumpType) {
            const started = this._fadeToAction(this.pendingJumpType, ANIMATION_FADE_DURATION);
            this.pendingJumpType = null;
            this.isJumping = started;
            this.jumpActionFinished = false;
        }

        if (this.isJumping) {
            if (this.grounded && this.jumpActionFinished) {
                this.isJumping = false;
            } else {
                this.mixer.update(dt);
                return;
            }
        }

        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        const nextAction = horizontalSpeed > WALK_SPEED_THRESHOLD ? 'walking' : 'idle';
        this._fadeToAction(nextAction, ANIMATION_FADE_DURATION);

        this.mixer.update(dt);
    }

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
