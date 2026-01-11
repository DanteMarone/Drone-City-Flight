// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';
import { FBXCharacter } from './fbx-character.js';
import { createRandomAppearance, buildPersonMesh } from './procedural.js';

export class Person {
    constructor(scene, useFBX = true) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();
        this.appearance = createRandomAppearance();
        this.useFBX = useFBX;
        this.fbxCharacter = null;
        this.isMoving = false;
        this.isJumping = false;
        this.wasGrounded = true;

        this.mesh = new THREE.Group();

        if (useFBX) {
            this._loadFBXCharacter();
        } else {
            buildPersonMesh(this.appearance, this.mesh);
        }

        this.scene.add(this.mesh);
    }

    async _loadFBXCharacter() {
        this.fbxCharacter = new FBXCharacter();

        try {
            console.log('Starting FBX character load...');
            // Use the idle animation FBX as the base model since it contains the skeleton
            // TODO: Replace with GLB file when available for better textures
            const model = await this.fbxCharacter.load({
                modelPath: new URL('./player_male01_idle.fbx', import.meta.url).href,
                animationPaths: {
                    idle: new URL('./player_male01_idle.fbx', import.meta.url).href,
                    walking: new URL('./player_male01_walking.fbx', import.meta.url).href,
                    movingJump: new URL('./player_male01_moving_jump.fbx', import.meta.url).href,
                    standingJump: new URL('./player_male01_standing_jump.fbx', import.meta.url).href
                },
                onProgress: (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        console.log(`Loading FBX: ${percentComplete.toFixed(2)}%`);
                    }
                }
            });

            console.log('FBX character loaded successfully!');
            this.mesh.add(model);

            // Start with idle animation
            this.fbxCharacter.playAnimation('idle');
            console.log('Playing idle animation');
        } catch (error) {
            console.error('Failed to load FBX character, falling back to basic mesh:', error);
            this.useFBX = false;
            this.mesh.clear(); // Clear any partial load
            buildPersonMesh(this.appearance, this.mesh);
        }
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        this._updatePhysics(dt, input, colliderSystem, dynamicColliders);
        this._updateAnimations(dt, input);
        this._syncMesh();
    }

    _updateAnimations(dt, input) {
        if (!this.useFBX || !this.fbxCharacter || !this.fbxCharacter.loaded()) {
            return;
        }

        // Update animation mixer
        this.fbxCharacter.update(dt);

        // Determine character state
        const moveInput = new THREE.Vector3(input.x || 0, 0, input.z || 0);
        const isMoving = moveInput.lengthSq() > 0.01;
        const justJumped = input.jump && this.grounded;
        const justLanded = !this.wasGrounded && this.grounded;

        // Handle animation transitions
        if (justJumped) {
            // Choose jump animation based on movement
            const jumpAnim = isMoving ? 'movingJump' : 'standingJump';
            this.fbxCharacter.playAnimation(jumpAnim, { loop: false });
            this.isJumping = true;
        } else if (this.isJumping && justLanded) {
            // Landed, transition back to appropriate animation
            this.isJumping = false;
            const targetAnim = isMoving ? 'walking' : 'idle';
            this.fbxCharacter.playAnimation(targetAnim);
        } else if (!this.isJumping) {
            // Normal ground movement
            if (isMoving && !this.isMoving) {
                this.fbxCharacter.playAnimation('walking');
                this.isMoving = true;
            } else if (!isMoving && this.isMoving) {
                this.fbxCharacter.playAnimation('idle');
                this.isMoving = false;
            }
        }

        this.wasGrounded = this.grounded;
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

    _syncMesh() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
    }
}
