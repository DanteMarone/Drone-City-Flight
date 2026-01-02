// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const MATERIAL_SETTINGS = {
    skin: { roughness: 0.35, metalness: 0.05 },
    cloth: { roughness: 0.75, metalness: 0.03 },
    accent: { roughness: 0.55, metalness: 0.2 },
    trim: { roughness: 0.45, metalness: 0.12 }
};

const SEGMENTS = {
    head: 28,
    body: 16,
    limb: 14
};

const MODEL_DIMENSIONS = {
    headRadius: 0.22,
    neckRadius: 0.07,
    neckLength: 0.08,
    limbRadius: 0.08,
    handRadius: 0.06,
    bootHeight: 0.12,
    bootWidth: 0.14,
    bootLength: 0.22,
    beltHeight: 0.08,
    jacketThickness: 0.04,
    shoulderDrop: 0.12,
    armGap: 0.04,
    eyeRadius: 0.03,
    eyeOffsetX: 0.06,
    eyeOffsetY: 0.02,
    eyeOffsetZ: 0.18,
    hairHeight: 0.07,
    hairRadius: 0.2,
    backpackWidth: 0.26,
    backpackHeight: 0.32,
    backpackDepth: 0.12,
    backpackOffsetZ: -0.18
};

const MODEL_RATIOS = {
    headOvalRadiusScale: 0.95,
    headSquareScale: { x: 1.45, y: 1.7, z: 1.35 },
    headOvalScale: new THREE.Vector3(0.95, 1.12, 0.9),
    bootToeOffset: 0.2,
    buzzScale: { x: 1.02, y: 0.6, z: 1.02 },
    capRadiusScale: 0.9,
    capHeightOffset: 0.6,
    ponytailRadiusScale: 0.45,
    ponytailHeightOffset: 0.4,
    ponytailBackOffset: 0.7,
    fadeScaleY: 0.5,
    fadeHeightOffset: 0.5,
    fadeRadiusScale: 0.95,
    maskWidthScale: 1.1,
    maskHeightScale: 0.45,
    maskDepthScale: 0.55,
    maskOffsetY: -0.1,
    maskOffsetZ: 0.35,
    visorRadiusScale: 0.9,
    visorHeightScale: 0.18,
    visorOffsetY: 0.05,
    visorOffsetZ: 0.28
};

const APPEARANCE_OPTIONS = {
    bodyProfiles: [
        {
            name: 'athletic',
            torsoRadius: 0.25,
            torsoLength: 0.7,
            shoulderWidth: 0.48,
            hipWidth: 0.34,
            legLength: 0.62,
            armLength: 0.5
        },
        {
            name: 'compact',
            torsoRadius: 0.23,
            torsoLength: 0.62,
            shoulderWidth: 0.44,
            hipWidth: 0.32,
            legLength: 0.58,
            armLength: 0.46
        },
        {
            name: 'tall',
            torsoRadius: 0.24,
            torsoLength: 0.74,
            shoulderWidth: 0.46,
            hipWidth: 0.33,
            legLength: 0.7,
            armLength: 0.52
        }
    ],
    headProfiles: [
        {
            name: 'round',
            geometry: () => new THREE.SphereGeometry(MODEL_DIMENSIONS.headRadius, SEGMENTS.head, SEGMENTS.head)
        },
        {
            name: 'square',
            geometry: () => new THREE.BoxGeometry(
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.headSquareScale.x,
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.headSquareScale.y,
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.headSquareScale.z
            )
        },
        {
            name: 'oval',
            geometry: () => new THREE.SphereGeometry(
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.headOvalRadiusScale,
                SEGMENTS.head,
                SEGMENTS.head
            ),
            scale: MODEL_RATIOS.headOvalScale
        }
    ],
    hairStyles: ['buzz', 'cap', 'ponytail', 'fade'],
    accessoryStyles: ['visor', 'mask', 'none'],
    skinTones: [0xffe0bd, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524],
    topColors: [0x2563eb, 0x7c3aed, 0x0f766e, 0xf97316, 0x0ea5e9],
    bottomColors: [0x1f2937, 0x374151, 0x1e3a8a, 0x4b5563, 0x0f172a],
    accentColors: [0xfacc15, 0xfb7185, 0xa3e635, 0x22d3ee, 0xf472b6],
    hairColors: [0x111827, 0x3f3f46, 0x92400e, 0xd97706, 0xf5f5f4]
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
        this.appearance = null;
        this.randomizeAppearance();
        this.scene.add(this.mesh);
    }

    randomizeAppearance() {
        const appearance = this._createRandomAppearance();
        this._applyAppearance(appearance);
        this.appearance = appearance;
    }

    _createRandomAppearance() {
        return {
            body: this._pickRandom(APPEARANCE_OPTIONS.bodyProfiles),
            head: this._pickRandom(APPEARANCE_OPTIONS.headProfiles),
            skinTone: this._pickRandom(APPEARANCE_OPTIONS.skinTones),
            topColor: this._pickRandom(APPEARANCE_OPTIONS.topColors),
            bottomColor: this._pickRandom(APPEARANCE_OPTIONS.bottomColors),
            accentColor: this._pickRandom(APPEARANCE_OPTIONS.accentColors),
            hairColor: this._pickRandom(APPEARANCE_OPTIONS.hairColors),
            hairStyle: this._pickRandom(APPEARANCE_OPTIONS.hairStyles),
            accessoryStyle: this._pickRandom(APPEARANCE_OPTIONS.accessoryStyles)
        };
    }

    _pickRandom(options) {
        return options[Math.floor(Math.random() * options.length)];
    }

    _applyAppearance(appearance) {
        this._clearMesh();
        this._buildMesh(appearance);
    }

    _clearMesh() {
        while (this.mesh.children.length > 0) {
            const child = this.mesh.children.pop();
            if (child) {
                child.traverse(node => {
                    if (node.geometry) {
                        node.geometry.dispose();
                    }
                    if (node.material) {
                        if (Array.isArray(node.material)) {
                            node.material.forEach(material => material.dispose());
                        } else {
                            node.material.dispose();
                        }
                    }
                });
                this.mesh.remove(child);
            }
        }
    }

    _buildMesh(appearance) {
        const { body, head, skinTone, topColor, bottomColor, accentColor, hairColor, hairStyle, accessoryStyle } = appearance;
        const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, ...MATERIAL_SETTINGS.skin });
        const topMat = new THREE.MeshStandardMaterial({ color: topColor, ...MATERIAL_SETTINGS.cloth });
        const bottomMat = new THREE.MeshStandardMaterial({ color: bottomColor, ...MATERIAL_SETTINGS.cloth });
        const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, ...MATERIAL_SETTINGS.accent });
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, ...MATERIAL_SETTINGS.trim });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, ...MATERIAL_SETTINGS.trim });

        const footHeight = MODEL_DIMENSIONS.bootHeight;
        const legCenterY = footHeight + body.legLength / 2;
        const torsoCenterY = footHeight + body.legLength + body.torsoLength / 2;
        const neckCenterY = footHeight + body.legLength + body.torsoLength + MODEL_DIMENSIONS.neckLength / 2;
        const headCenterY = footHeight + body.legLength + body.torsoLength + MODEL_DIMENSIONS.neckLength + MODEL_DIMENSIONS.headRadius;

        const torso = new THREE.Mesh(
            new THREE.CapsuleGeometry(body.torsoRadius, body.torsoLength, SEGMENTS.body, SEGMENTS.body),
            topMat
        );
        torso.position.y = torsoCenterY;
        torso.castShadow = true;
        torso.receiveShadow = true;
        this.mesh.add(torso);

        const jacket = new THREE.Mesh(
            new THREE.CapsuleGeometry(
                body.torsoRadius + MODEL_DIMENSIONS.jacketThickness,
                body.torsoLength,
                SEGMENTS.body,
                SEGMENTS.body
            ),
            accentMat
        );
        jacket.position.y = torsoCenterY;
        jacket.castShadow = true;
        jacket.receiveShadow = true;
        this.mesh.add(jacket);

        const belt = new THREE.Mesh(
            new THREE.CylinderGeometry(body.torsoRadius + MODEL_DIMENSIONS.jacketThickness, body.torsoRadius + MODEL_DIMENSIONS.jacketThickness, MODEL_DIMENSIONS.beltHeight, SEGMENTS.body),
            bottomMat
        );
        belt.position.y = footHeight + body.legLength + MODEL_DIMENSIONS.beltHeight / 2;
        belt.castShadow = true;
        belt.receiveShadow = true;
        this.mesh.add(belt);

        const legGeometry = new THREE.CapsuleGeometry(MODEL_DIMENSIONS.limbRadius, body.legLength, SEGMENTS.limb, SEGMENTS.limb);
        const legOffsetX = body.hipWidth / 2;

        const leftLeg = new THREE.Mesh(legGeometry, bottomMat);
        leftLeg.position.set(-legOffsetX, legCenterY, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, bottomMat);
        rightLeg.position.set(legOffsetX, legCenterY, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.mesh.add(rightLeg);

        const bootGeometry = new THREE.BoxGeometry(MODEL_DIMENSIONS.bootWidth, MODEL_DIMENSIONS.bootHeight, MODEL_DIMENSIONS.bootLength);
        const bootCenterY = MODEL_DIMENSIONS.bootHeight / 2;

        const leftBoot = new THREE.Mesh(bootGeometry, accentMat);
        leftBoot.position.set(-legOffsetX, bootCenterY, MODEL_DIMENSIONS.bootLength * MODEL_RATIOS.bootToeOffset);
        leftBoot.castShadow = true;
        leftBoot.receiveShadow = true;
        this.mesh.add(leftBoot);

        const rightBoot = new THREE.Mesh(bootGeometry, accentMat);
        rightBoot.position.set(legOffsetX, bootCenterY, MODEL_DIMENSIONS.bootLength * MODEL_RATIOS.bootToeOffset);
        rightBoot.castShadow = true;
        rightBoot.receiveShadow = true;
        this.mesh.add(rightBoot);

        const shoulderY = footHeight + body.legLength + body.torsoLength - MODEL_DIMENSIONS.shoulderDrop;
        const armCenterY = shoulderY - body.armLength / 2;
        const armOffsetX = body.shoulderWidth / 2 + MODEL_DIMENSIONS.armGap;

        const armGeometry = new THREE.CapsuleGeometry(MODEL_DIMENSIONS.limbRadius, body.armLength, SEGMENTS.limb, SEGMENTS.limb);

        const leftArm = new THREE.Mesh(armGeometry, topMat);
        leftArm.position.set(-armOffsetX, armCenterY, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, topMat);
        rightArm.position.set(armOffsetX, armCenterY, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        this.mesh.add(rightArm);

        const handGeometry = new THREE.SphereGeometry(MODEL_DIMENSIONS.handRadius, SEGMENTS.limb, SEGMENTS.limb);
        const handY = shoulderY - body.armLength;

        const leftHand = new THREE.Mesh(handGeometry, skinMat);
        leftHand.position.set(-armOffsetX, handY, 0);
        leftHand.castShadow = true;
        leftHand.receiveShadow = true;
        this.mesh.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, skinMat);
        rightHand.position.set(armOffsetX, handY, 0);
        rightHand.castShadow = true;
        rightHand.receiveShadow = true;
        this.mesh.add(rightHand);

        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(MODEL_DIMENSIONS.neckRadius, MODEL_DIMENSIONS.neckRadius, MODEL_DIMENSIONS.neckLength, SEGMENTS.limb),
            skinMat
        );
        neck.position.y = neckCenterY;
        neck.castShadow = true;
        neck.receiveShadow = true;
        this.mesh.add(neck);

        const headMesh = new THREE.Mesh(head.geometry(), skinMat);
        if (head.scale) {
            headMesh.scale.copy(head.scale);
        }
        headMesh.position.y = headCenterY;
        headMesh.castShadow = true;
        headMesh.receiveShadow = true;
        this.mesh.add(headMesh);

        const eyeGeometry = new THREE.SphereGeometry(MODEL_DIMENSIONS.eyeRadius, SEGMENTS.limb, SEGMENTS.limb);
        const eyeY = headCenterY + MODEL_DIMENSIONS.eyeOffsetY;
        const eyeZ = MODEL_DIMENSIONS.eyeOffsetZ;

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMat);
        leftEye.position.set(-MODEL_DIMENSIONS.eyeOffsetX, eyeY, eyeZ);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMat);
        rightEye.position.set(MODEL_DIMENSIONS.eyeOffsetX, eyeY, eyeZ);
        this.mesh.add(rightEye);

        this._addHair(headCenterY, hairStyle, hairMat);
        this._addAccessory(headCenterY, accessoryStyle, accentMat);

        const backpack = new THREE.Mesh(
            new THREE.BoxGeometry(MODEL_DIMENSIONS.backpackWidth, MODEL_DIMENSIONS.backpackHeight, MODEL_DIMENSIONS.backpackDepth),
            accentMat
        );
        backpack.position.set(0, torsoCenterY, MODEL_DIMENSIONS.backpackOffsetZ);
        backpack.castShadow = true;
        backpack.receiveShadow = true;
        this.mesh.add(backpack);
    }

    _addHair(headCenterY, style, hairMat) {
        if (style === 'none') return;
        if (style === 'buzz') {
            const buzz = new THREE.Mesh(
                new THREE.SphereGeometry(MODEL_DIMENSIONS.hairRadius, SEGMENTS.body, SEGMENTS.body),
                hairMat
            );
            buzz.scale.set(MODEL_RATIOS.buzzScale.x, MODEL_RATIOS.buzzScale.y, MODEL_RATIOS.buzzScale.z);
            buzz.position.y = headCenterY + MODEL_DIMENSIONS.hairHeight;
            this.mesh.add(buzz);
            return;
        }
        if (style === 'cap') {
            const cap = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    MODEL_DIMENSIONS.hairRadius,
                    MODEL_DIMENSIONS.hairRadius * MODEL_RATIOS.capRadiusScale,
                    MODEL_DIMENSIONS.hairHeight,
                    SEGMENTS.body
                ),
                hairMat
            );
            cap.position.y = headCenterY + MODEL_DIMENSIONS.hairHeight * MODEL_RATIOS.capHeightOffset;
            this.mesh.add(cap);
            return;
        }
        if (style === 'ponytail') {
            const bun = new THREE.Mesh(
                new THREE.SphereGeometry(
                    MODEL_DIMENSIONS.hairRadius * MODEL_RATIOS.ponytailRadiusScale,
                    SEGMENTS.body,
                    SEGMENTS.body
                ),
                hairMat
            );
            bun.position.set(
                0,
                headCenterY + MODEL_DIMENSIONS.hairHeight * MODEL_RATIOS.ponytailHeightOffset,
                -MODEL_DIMENSIONS.hairRadius * MODEL_RATIOS.ponytailBackOffset
            );
            this.mesh.add(bun);
            return;
        }
        if (style === 'fade') {
            const fade = new THREE.Mesh(
                new THREE.SphereGeometry(
                    MODEL_DIMENSIONS.hairRadius * MODEL_RATIOS.fadeRadiusScale,
                    SEGMENTS.body,
                    SEGMENTS.body
                ),
                hairMat
            );
            fade.scale.set(1, MODEL_RATIOS.fadeScaleY, 1);
            fade.position.y = headCenterY + MODEL_DIMENSIONS.hairHeight * MODEL_RATIOS.fadeHeightOffset;
            this.mesh.add(fade);
        }
    }

    _addAccessory(headCenterY, style, accentMat) {
        if (style === 'none') return;
        if (style === 'mask') {
            const mask = new THREE.Mesh(
                new THREE.BoxGeometry(
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.maskWidthScale,
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.maskHeightScale,
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.maskDepthScale
                ),
                accentMat
            );
            mask.position.set(
                0,
                headCenterY + MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.maskOffsetY,
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.maskOffsetZ
            );
            this.mesh.add(mask);
            return;
        }
        if (style === 'visor') {
            const visor = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.visorRadiusScale,
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.visorRadiusScale,
                    MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.visorHeightScale,
                    SEGMENTS.body
                ),
                accentMat
            );
            visor.rotation.x = Math.PI / 2;
            visor.position.set(
                0,
                headCenterY + MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.visorOffsetY,
                MODEL_DIMENSIONS.headRadius * MODEL_RATIOS.visorOffsetZ
            );
            this.mesh.add(visor);
        }
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    update(dt, input, colliderSystem, dynamicColliders = []) {
        this._updatePhysics(dt, input, colliderSystem, dynamicColliders);
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
