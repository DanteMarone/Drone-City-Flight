// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';
import { FBXCharacter } from './fbx-character.js';

const MODEL_DIMENSIONS = {
    torso: {
        radius: 0.22,
        height: 0.52,
        capSegments: 6,
        radialSegments: 12,
        y: 0.78
    },
    hip: {
        radius: 0.24,
        height: 0.18,
        capSegments: 6,
        radialSegments: 12,
        y: 0.5
    },
    neck: {
        radius: 0.07,
        height: 0.08,
        radialSegments: 10,
        y: 1.02
    },
    head: {
        radius: 0.18,
        widthSegments: 22,
        heightSegments: 18,
        y: 1.27
    },
    arm: {
        upperLength: 0.26,
        lowerLength: 0.24,
        radius: 0.06,
        radialSegments: 10
    },
    leg: {
        upperLength: 0.32,
        lowerLength: 0.3,
        radius: 0.08,
        radialSegments: 12
    },
    hand: {
        radius: 0.065,
        widthSegments: 12,
        heightSegments: 12
    },
    foot: {
        width: 0.14,
        height: 0.07,
        length: 0.2
    },
    shoulders: {
        offset: 0.28,
        drop: 0.05
    },
    hips: {
        offset: 0.14
    },
    joints: {
        elbowGap: 0.02,
        kneeGap: 0.02,
        handOffset: 0.02,
        footOffset: 0.05
    },
    face: {
        eyeRadius: 0.028,
        eyeSegments: 12,
        eyeOffsetX: 0.06,
        eyeOffsetY: 0.04,
        eyeOffsetZ: 0.15,
        mouthWidth: 0.08,
        mouthHeight: 0.02,
        mouthDepth: 0.02,
        mouthOffsetY: -0.05,
        mouthOffsetZ: 0.16
    },
    hair: {
        topHeight: 0.12,
        topRadius: 0.19,
        bunRadius: 0.07,
        bunOffsetZ: -0.14,
        bunOffsetY: 0.02
    }
};

const MATERIAL_PROPS = {
    skin: { roughness: 0.35, metalness: 0.05 },
    cloth: { roughness: 0.75, metalness: 0.02 },
    accent: { roughness: 0.4, metalness: 0.15 }
};

const APPEARANCE_POOLS = {
    skinTones: [0xf6e4d4, 0xe7c7a1, 0xd9a67a, 0xc2875a, 0xa96c41, 0x7a4b2a],
    hairColors: [0x1f1b16, 0x3b3027, 0x5a3c24, 0x8b5e34, 0xc9a46a, 0x3a4a6b],
    clothingPrimary: [0x1d4ed8, 0x0f766e, 0x9333ea, 0xc2410c, 0x0f172a, 0x1f2937],
    clothingSecondary: [0xf8fafc, 0x94a3b8, 0x475569, 0x7c3aed, 0x0f172a, 0x334155],
    accentColors: [0xfacc15, 0x22c55e, 0xf97316, 0x38bdf8, 0xe11d48, 0xa3e635],
    headStyles: [
        {
            name: 'rounded',
            geometry: 'sphere',
            scale: new THREE.Vector3(1, 1, 1),
            hairStyle: 'short'
        },
        {
            name: 'oval',
            geometry: 'sphere',
            scale: new THREE.Vector3(0.92, 1.12, 0.95),
            hairStyle: 'swept'
        },
        {
            name: 'square',
            geometry: 'box',
            scale: new THREE.Vector3(1.02, 0.98, 0.98),
            hairStyle: 'bun'
        }
    ],
    bodyStyles: [
        {
            name: 'lean',
            torsoScale: new THREE.Vector3(0.92, 1.05, 0.9),
            limbScale: 0.95,
            shoulderScale: 0.95,
            hipScale: 0.92
        },
        {
            name: 'athletic',
            torsoScale: new THREE.Vector3(1.02, 1.05, 1.02),
            limbScale: 1.02,
            shoulderScale: 1.05,
            hipScale: 1.0
        },
        {
            name: 'sturdy',
            torsoScale: new THREE.Vector3(1.08, 1.0, 1.08),
            limbScale: 0.98,
            shoulderScale: 1.08,
            hipScale: 1.1
        }
    ]
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const pickDistinct = (items, avoid) => {
    if (items.length <= 1) return items[0];
    let pick = pickRandom(items);
    while (pick === avoid) {
        pick = pickRandom(items);
    }
    return pick;
};

export class Person {
    constructor(scene, useFBX = true) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();
        this.appearance = this._createRandomAppearance();
        this.useFBX = useFBX;
        this.fbxCharacter = null;
        this.isMoving = false;
        this.isJumping = false;
        this.wasGrounded = true;

        this.mesh = new THREE.Group();

        if (useFBX) {
            this._loadFBXCharacter();
        } else {
            this._buildMesh();
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
            this._buildMesh();
        }
    }

    _buildMesh() {
        const {
            skinTone,
            hairColor,
            clothingPrimary,
            clothingSecondary,
            accentColor,
            headStyle,
            bodyStyle
        } = this.appearance;

        const skinMat = new THREE.MeshStandardMaterial({
            color: skinTone,
            roughness: MATERIAL_PROPS.skin.roughness,
            metalness: MATERIAL_PROPS.skin.metalness
        });
        const clothPrimaryMat = new THREE.MeshStandardMaterial({
            color: clothingPrimary,
            roughness: MATERIAL_PROPS.cloth.roughness,
            metalness: MATERIAL_PROPS.cloth.metalness
        });
        const clothSecondaryMat = new THREE.MeshStandardMaterial({
            color: clothingSecondary,
            roughness: MATERIAL_PROPS.cloth.roughness,
            metalness: MATERIAL_PROPS.cloth.metalness
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: MATERIAL_PROPS.accent.roughness,
            metalness: MATERIAL_PROPS.accent.metalness
        });
        const hairMat = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: MATERIAL_PROPS.cloth.roughness,
            metalness: MATERIAL_PROPS.cloth.metalness
        });

        const torsoGeometry = new THREE.CapsuleGeometry(
            MODEL_DIMENSIONS.torso.radius,
            MODEL_DIMENSIONS.torso.height,
            MODEL_DIMENSIONS.torso.capSegments,
            MODEL_DIMENSIONS.torso.radialSegments
        );
        const torso = new THREE.Mesh(torsoGeometry, clothPrimaryMat);
        torso.scale.copy(bodyStyle.torsoScale);
        torso.position.y = MODEL_DIMENSIONS.torso.y;
        this._applyShadows(torso);
        this.mesh.add(torso);

        const hipGeometry = new THREE.CapsuleGeometry(
            MODEL_DIMENSIONS.hip.radius,
            MODEL_DIMENSIONS.hip.height,
            MODEL_DIMENSIONS.hip.capSegments,
            MODEL_DIMENSIONS.hip.radialSegments
        );
        const hips = new THREE.Mesh(hipGeometry, clothSecondaryMat);
        hips.scale.set(bodyStyle.hipScale, 1, bodyStyle.hipScale);
        hips.position.y = MODEL_DIMENSIONS.hip.y;
        this._applyShadows(hips);
        this.mesh.add(hips);

        const neckGeometry = new THREE.CylinderGeometry(
            MODEL_DIMENSIONS.neck.radius,
            MODEL_DIMENSIONS.neck.radius,
            MODEL_DIMENSIONS.neck.height,
            MODEL_DIMENSIONS.neck.radialSegments
        );
        const neck = new THREE.Mesh(neckGeometry, skinMat);
        neck.position.y = MODEL_DIMENSIONS.neck.y;
        this._applyShadows(neck);
        this.mesh.add(neck);

        const headGroup = new THREE.Group();
        const headGeometry = this._createHeadGeometry(headStyle);
        const head = new THREE.Mesh(headGeometry, skinMat);
        head.scale.copy(headStyle.scale);
        head.position.y = MODEL_DIMENSIONS.head.y;
        this._applyShadows(head);
        headGroup.add(head);

        const eyeGeometry = new THREE.SphereGeometry(
            MODEL_DIMENSIONS.face.eyeRadius,
            MODEL_DIMENSIONS.face.eyeSegments,
            MODEL_DIMENSIONS.face.eyeSegments
        );
        const eyeLeft = new THREE.Mesh(eyeGeometry, accentMat);
        eyeLeft.position.set(
            MODEL_DIMENSIONS.face.eyeOffsetX,
            MODEL_DIMENSIONS.head.y + MODEL_DIMENSIONS.face.eyeOffsetY,
            MODEL_DIMENSIONS.face.eyeOffsetZ
        );
        const eyeRight = eyeLeft.clone();
        eyeRight.position.x = -MODEL_DIMENSIONS.face.eyeOffsetX;
        this._applyShadows(eyeLeft);
        this._applyShadows(eyeRight);
        headGroup.add(eyeLeft, eyeRight);

        const mouthGeometry = new THREE.BoxGeometry(
            MODEL_DIMENSIONS.face.mouthWidth,
            MODEL_DIMENSIONS.face.mouthHeight,
            MODEL_DIMENSIONS.face.mouthDepth
        );
        const mouth = new THREE.Mesh(mouthGeometry, accentMat);
        mouth.position.set(
            0,
            MODEL_DIMENSIONS.head.y + MODEL_DIMENSIONS.face.mouthOffsetY,
            MODEL_DIMENSIONS.face.mouthOffsetZ
        );
        this._applyShadows(mouth);
        headGroup.add(mouth);

        this._addHair(headGroup, headStyle, hairMat);
        this.mesh.add(headGroup);

        this._buildArms({
            skinMat,
            clothSecondaryMat,
            bodyStyle
        });
        this._buildLegs({
            skinMat,
            clothSecondaryMat,
            accentMat,
            bodyStyle
        });
    }

    _createHeadGeometry(headStyle) {
        if (headStyle.geometry === 'box') {
            const size = MODEL_DIMENSIONS.head.radius * 2;
            return new THREE.BoxGeometry(size, size, size);
        }
        return new THREE.SphereGeometry(
            MODEL_DIMENSIONS.head.radius,
            MODEL_DIMENSIONS.head.widthSegments,
            MODEL_DIMENSIONS.head.heightSegments
        );
    }

    _buildArms({ skinMat, clothSecondaryMat, bodyStyle }) {
        const shoulderOffset = MODEL_DIMENSIONS.shoulders.offset * bodyStyle.shoulderScale;
        const upperArmLength = MODEL_DIMENSIONS.arm.upperLength * bodyStyle.limbScale;
        const lowerArmLength = MODEL_DIMENSIONS.arm.lowerLength * bodyStyle.limbScale;
        const armRadius = MODEL_DIMENSIONS.arm.radius;
        const shoulderY =
            MODEL_DIMENSIONS.torso.y + MODEL_DIMENSIONS.torso.height * 0.5 - MODEL_DIMENSIONS.shoulders.drop;

        const upperArmGeometry = new THREE.CylinderGeometry(
            armRadius,
            armRadius,
            upperArmLength,
            MODEL_DIMENSIONS.arm.radialSegments
        );
        const lowerArmGeometry = new THREE.CylinderGeometry(
            armRadius * 0.95,
            armRadius * 0.95,
            lowerArmLength,
            MODEL_DIMENSIONS.arm.radialSegments
        );
        const handGeometry = new THREE.SphereGeometry(
            MODEL_DIMENSIONS.hand.radius,
            MODEL_DIMENSIONS.hand.widthSegments,
            MODEL_DIMENSIONS.hand.heightSegments
        );

        const buildArm = (side) => {
            const armGroup = new THREE.Group();
            const upperArm = new THREE.Mesh(upperArmGeometry, clothSecondaryMat);
            upperArm.position.y = shoulderY - upperArmLength * 0.5;
            this._applyShadows(upperArm);

            const lowerArm = new THREE.Mesh(lowerArmGeometry, skinMat);
            lowerArm.position.y =
                shoulderY - upperArmLength - MODEL_DIMENSIONS.joints.elbowGap - lowerArmLength * 0.5;
            this._applyShadows(lowerArm);

            const hand = new THREE.Mesh(handGeometry, skinMat);
            hand.position.y =
                shoulderY - upperArmLength - MODEL_DIMENSIONS.joints.elbowGap - lowerArmLength -
                MODEL_DIMENSIONS.joints.handOffset;
            this._applyShadows(hand);

            armGroup.add(upperArm, lowerArm, hand);
            armGroup.position.x = shoulderOffset * side;
            this.mesh.add(armGroup);
        };

        buildArm(1);
        buildArm(-1);
    }

    _buildLegs({ skinMat, clothSecondaryMat, accentMat, bodyStyle }) {
        const hipOffset = MODEL_DIMENSIONS.hips.offset * bodyStyle.hipScale;
        const upperLegLength = MODEL_DIMENSIONS.leg.upperLength * bodyStyle.limbScale;
        const lowerLegLength = MODEL_DIMENSIONS.leg.lowerLength * bodyStyle.limbScale;
        const legRadius = MODEL_DIMENSIONS.leg.radius;

        const hipTopY = MODEL_DIMENSIONS.hip.y + MODEL_DIMENSIONS.hip.height * 0.5;
        const upperLegGeometry = new THREE.CylinderGeometry(
            legRadius,
            legRadius,
            upperLegLength,
            MODEL_DIMENSIONS.leg.radialSegments
        );
        const lowerLegGeometry = new THREE.CylinderGeometry(
            legRadius * 0.95,
            legRadius * 0.95,
            lowerLegLength,
            MODEL_DIMENSIONS.leg.radialSegments
        );
        const footGeometry = new THREE.BoxGeometry(
            MODEL_DIMENSIONS.foot.width,
            MODEL_DIMENSIONS.foot.height,
            MODEL_DIMENSIONS.foot.length
        );

        const buildLeg = (side) => {
            const legGroup = new THREE.Group();

            const upperLeg = new THREE.Mesh(upperLegGeometry, clothSecondaryMat);
            upperLeg.position.y = hipTopY - upperLegLength * 0.5;
            this._applyShadows(upperLeg);

            const lowerLeg = new THREE.Mesh(lowerLegGeometry, clothSecondaryMat);
            lowerLeg.position.y =
                hipTopY - upperLegLength - MODEL_DIMENSIONS.joints.kneeGap - lowerLegLength * 0.5;
            this._applyShadows(lowerLeg);

            const foot = new THREE.Mesh(footGeometry, accentMat);
            foot.position.y =
                hipTopY - upperLegLength - MODEL_DIMENSIONS.joints.kneeGap - lowerLegLength -
                MODEL_DIMENSIONS.joints.footOffset;
            foot.position.z = MODEL_DIMENSIONS.foot.length * 0.25;
            this._applyShadows(foot);

            const ankle = new THREE.Mesh(
                new THREE.SphereGeometry(
                    legRadius * 0.7,
                    MODEL_DIMENSIONS.hand.widthSegments,
                    MODEL_DIMENSIONS.hand.heightSegments
                ),
                skinMat
            );
            ankle.position.y =
                hipTopY - upperLegLength - MODEL_DIMENSIONS.joints.kneeGap - lowerLegLength;
            this._applyShadows(ankle);

            legGroup.add(upperLeg, lowerLeg, ankle, foot);
            legGroup.position.x = hipOffset * side;
            this.mesh.add(legGroup);
        };

        buildLeg(1);
        buildLeg(-1);
    }

    _addHair(headGroup, headStyle, hairMat) {
        if (headStyle.hairStyle === 'short') {
            const hairGeometry = new THREE.CylinderGeometry(
                MODEL_DIMENSIONS.hair.topRadius,
                MODEL_DIMENSIONS.hair.topRadius * 0.85,
                MODEL_DIMENSIONS.hair.topHeight,
                MODEL_DIMENSIONS.head.widthSegments
            );
            const hair = new THREE.Mesh(hairGeometry, hairMat);
            hair.position.y = MODEL_DIMENSIONS.head.y + MODEL_DIMENSIONS.hair.topHeight * 0.5;
            this._applyShadows(hair);
            headGroup.add(hair);
            return;
        }

        if (headStyle.hairStyle === 'swept') {
            const hairGeometry = new THREE.SphereGeometry(
                MODEL_DIMENSIONS.hair.topRadius,
                MODEL_DIMENSIONS.head.widthSegments,
                MODEL_DIMENSIONS.head.heightSegments
            );
            const hair = new THREE.Mesh(hairGeometry, hairMat);
            hair.scale.set(1, 0.6, 1);
            hair.position.y = MODEL_DIMENSIONS.head.y + MODEL_DIMENSIONS.hair.topHeight * 0.4;
            hair.position.z = MODEL_DIMENSIONS.face.eyeOffsetZ * 0.4;
            this._applyShadows(hair);
            headGroup.add(hair);
            return;
        }

        const bunGeometry = new THREE.SphereGeometry(
            MODEL_DIMENSIONS.hair.bunRadius,
            MODEL_DIMENSIONS.head.widthSegments,
            MODEL_DIMENSIONS.head.heightSegments
        );
        const bun = new THREE.Mesh(bunGeometry, hairMat);
        bun.position.set(
            0,
            MODEL_DIMENSIONS.head.y + MODEL_DIMENSIONS.hair.bunOffsetY,
            MODEL_DIMENSIONS.hair.bunOffsetZ
        );
        this._applyShadows(bun);
        headGroup.add(bun);
    }

    _applyShadows(mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    _createRandomAppearance() {
        const clothingPrimary = pickRandom(APPEARANCE_POOLS.clothingPrimary);
        const clothingSecondary = pickDistinct(APPEARANCE_POOLS.clothingSecondary, clothingPrimary);
        return {
            skinTone: pickRandom(APPEARANCE_POOLS.skinTones),
            hairColor: pickRandom(APPEARANCE_POOLS.hairColors),
            clothingPrimary,
            clothingSecondary,
            accentColor: pickRandom(APPEARANCE_POOLS.accentColors),
            headStyle: pickRandom(APPEARANCE_POOLS.headStyles),
            bodyStyle: pickRandom(APPEARANCE_POOLS.bodyStyles)
        };
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
