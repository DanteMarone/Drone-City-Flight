// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const MODEL = {
    head: {
        radius: 0.19,
        width: 0.3,
        height: 0.26,
        depth: 0.26,
        segments: 20,
        positionY: 1.25
    },
    neck: {
        radius: 0.06,
        length: 0.08,
        positionY: 1.05
    },
    torso: {
        radius: 0.23,
        length: 0.55,
        width: 0.42,
        height: 0.6,
        depth: 0.28,
        positionY: 0.72,
        segments: 6
    },
    hips: {
        radius: 0.18,
        length: 0.2,
        positionY: 0.4,
        segments: 6
    },
    arm: {
        radius: 0.06,
        upperLength: 0.32,
        lowerLength: 0.28,
        offsetX: 0.32,
        upperPositionY: 0.82,
        lowerPositionY: 0.55,
        handRadius: 0.065,
        handDropFactor: 0.5,
        upperRotationZ: Math.PI / 12,
        lowerRotationZ: Math.PI / 14
    },
    leg: {
        radius: 0.075,
        upperLength: 0.38,
        lowerLength: 0.34,
        offsetX: 0.13,
        upperPositionY: 0.2,
        lowerPositionY: -0.12,
        footWidth: 0.12,
        footHeight: 0.08,
        footDepth: 0.2,
        footDropFactor: 0.5,
        footHeightOffset: 0.3,
        footForwardFactor: 0.2
    },
    hair: {
        radius: 0.2,
        height: 0.12,
        positionY: 1.38
    },
    eyes: {
        radius: 0.025,
        offsetX: 0.06,
        offsetY: 1.26,
        offsetZ: 0.17
    },
    accessories: {
        badgeRadius: 0.05,
        badgeDepth: 0.02,
        badgeOffsetX: 0.12,
        badgeOffsetY: 0.9,
        badgeOffsetZ: 0.18,
        backpackWidth: 0.28,
        backpackHeight: 0.32,
        backpackDepth: 0.12,
        backpackOffsetY: 0.75,
        backpackOffsetZ: -0.2,
        badgeRotationX: Math.PI / 2
    }
};

const APPEARANCE_POOL = {
    skinTones: [0xf9d7c3, 0xf2c4a0, 0xe5b58f, 0xd9a07b, 0xc58d6a, 0xb57958, 0xa4684d],
    hairColors: [0x2c1b18, 0x3b2f2f, 0x4b2e2b, 0x5a3a2f, 0x7a5c43, 0x9b6b4f, 0xd8b18f],
    topColors: [0x2563eb, 0x0f766e, 0x9333ea, 0xdb2777, 0xf97316, 0x14b8a6, 0x4b5563],
    bottomColors: [0x1f2937, 0x4b5563, 0x6b7280, 0x374151, 0x0f172a],
    accentColors: [0xf59e0b, 0x22c55e, 0x38bdf8, 0xf43f5e, 0xa855f7, 0xf472b6]
};

const HEAD_SHAPES = ['sphere', 'box'];
const TORSO_SHAPES = ['capsule', 'box'];
const ACCESSORY_OPTIONS = ['badge', 'backpack', 'none'];

const pickRandom = (options) => options[Math.floor(Math.random() * options.length)];
const applyShadow = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
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
        this.appearance = this._generateAppearance();
        this._rebuildMesh();
    }

    _generateAppearance() {
        return {
            headShape: pickRandom(HEAD_SHAPES),
            torsoShape: pickRandom(TORSO_SHAPES),
            accessory: pickRandom(ACCESSORY_OPTIONS),
            skinTone: pickRandom(APPEARANCE_POOL.skinTones),
            hairColor: pickRandom(APPEARANCE_POOL.hairColors),
            topColor: pickRandom(APPEARANCE_POOL.topColors),
            bottomColor: pickRandom(APPEARANCE_POOL.bottomColors),
            accentColor: pickRandom(APPEARANCE_POOL.accentColors)
        };
    }

    _clearMesh() {
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
        });
        this.mesh.clear();
    }

    _rebuildMesh() {
        this._clearMesh();
        this._buildMesh();
    }

    _buildMesh() {
        const appearance = this.appearance;
        const skinMat = new THREE.MeshStandardMaterial({ color: appearance.skinTone, roughness: 0.5 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
        const hairMat = new THREE.MeshStandardMaterial({ color: appearance.hairColor, roughness: 0.6 });
        const topMat = new THREE.MeshStandardMaterial({ color: appearance.topColor, roughness: 0.55 });
        const bottomMat = new THREE.MeshStandardMaterial({ color: appearance.bottomColor, roughness: 0.65 });
        const accentMat = new THREE.MeshStandardMaterial({ color: appearance.accentColor, roughness: 0.4, metalness: 0.1 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });

        const head = this._buildHead(appearance.headShape, skinMat);
        this.mesh.add(head);

        const hair = new THREE.Mesh(
            new THREE.CylinderGeometry(MODEL.hair.radius, MODEL.hair.radius * 0.95, MODEL.hair.height, MODEL.head.segments),
            hairMat
        );
        hair.position.y = MODEL.hair.positionY;
        applyShadow(hair);
        this.mesh.add(hair);

        const eyes = this._buildEyes(eyeMat);
        this.mesh.add(eyes);

        const neck = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.neck.radius, MODEL.neck.length, MODEL.torso.segments, MODEL.head.segments),
            skinMat
        );
        neck.position.y = MODEL.neck.positionY;
        applyShadow(neck);
        this.mesh.add(neck);

        const torso = this._buildTorso(appearance.torsoShape, topMat);
        this.mesh.add(torso);

        const hips = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.hips.radius, MODEL.hips.length, MODEL.hips.segments, MODEL.head.segments),
            bottomMat
        );
        hips.position.y = MODEL.hips.positionY;
        applyShadow(hips);
        this.mesh.add(hips);

        const arms = this._buildArms(topMat, skinMat);
        this.mesh.add(arms);

        const legs = this._buildLegs(bottomMat, shoeMat);
        this.mesh.add(legs);

        const accessories = this._buildAccessories(appearance.accessory, accentMat, topMat);
        if (accessories) {
            this.mesh.add(accessories);
        }
    }

    _buildHead(shape, skinMat) {
        let geometry = null;
        if (shape === 'box') {
            geometry = new THREE.BoxGeometry(MODEL.head.width, MODEL.head.height, MODEL.head.depth, MODEL.head.segments, MODEL.head.segments, MODEL.head.segments);
        } else {
            geometry = new THREE.SphereGeometry(MODEL.head.radius, MODEL.head.segments, MODEL.head.segments);
        }
        const head = new THREE.Mesh(geometry, skinMat);
        head.position.y = MODEL.head.positionY;
        applyShadow(head);
        return head;
    }

    _buildEyes(eyeMat) {
        const eyes = new THREE.Group();
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(MODEL.eyes.radius, MODEL.head.segments, MODEL.head.segments), eyeMat);
        leftEye.position.set(-MODEL.eyes.offsetX, MODEL.eyes.offsetY, MODEL.eyes.offsetZ);
        applyShadow(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.x = MODEL.eyes.offsetX;
        eyes.add(leftEye, rightEye);
        return eyes;
    }

    _buildTorso(shape, topMat) {
        let geometry = null;
        if (shape === 'box') {
            geometry = new THREE.BoxGeometry(MODEL.torso.width, MODEL.torso.height, MODEL.torso.depth, MODEL.torso.segments, MODEL.torso.segments, MODEL.torso.segments);
        } else {
            geometry = new THREE.CapsuleGeometry(MODEL.torso.radius, MODEL.torso.length, MODEL.torso.segments, MODEL.head.segments);
        }
        const torso = new THREE.Mesh(geometry, topMat);
        torso.position.y = MODEL.torso.positionY;
        applyShadow(torso);
        return torso;
    }

    _buildArms(topMat, skinMat) {
        const arms = new THREE.Group();
        const leftArm = this._buildArm(topMat, skinMat, -1);
        leftArm.position.x = -MODEL.arm.offsetX;
        arms.add(leftArm);

        const rightArm = this._buildArm(topMat, skinMat, 1);
        rightArm.position.x = MODEL.arm.offsetX;
        arms.add(rightArm);
        return arms;
    }

    _buildArm(topMat, skinMat, side) {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.arm.radius, MODEL.arm.upperLength, MODEL.torso.segments, MODEL.head.segments),
            topMat
        );
        upper.position.y = MODEL.arm.upperPositionY;
        upper.rotation.z = MODEL.arm.upperRotationZ * side;
        applyShadow(upper);

        const lower = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.arm.radius * 0.95, MODEL.arm.lowerLength, MODEL.torso.segments, MODEL.head.segments),
            skinMat
        );
        lower.position.y = MODEL.arm.lowerPositionY;
        lower.rotation.z = MODEL.arm.lowerRotationZ * side;
        applyShadow(lower);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(MODEL.arm.handRadius, MODEL.head.segments, MODEL.head.segments), skinMat);
        hand.position.y = MODEL.arm.lowerPositionY - (MODEL.arm.lowerLength * MODEL.arm.handDropFactor);
        applyShadow(hand);

        arm.add(upper, lower, hand);
        return arm;
    }

    _buildLegs(bottomMat, shoeMat) {
        const legs = new THREE.Group();
        const legGroup = this._buildLeg(bottomMat, shoeMat);
        legGroup.position.x = -MODEL.leg.offsetX;
        legs.add(legGroup);

        const legGroupRight = legGroup.clone();
        legGroupRight.position.x = MODEL.leg.offsetX;
        legs.add(legGroupRight);
        return legs;
    }

    _buildLeg(bottomMat, shoeMat) {
        const leg = new THREE.Group();
        const upper = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.leg.radius, MODEL.leg.upperLength, MODEL.torso.segments, MODEL.head.segments),
            bottomMat
        );
        upper.position.y = MODEL.leg.upperPositionY;
        applyShadow(upper);

        const lower = new THREE.Mesh(
            new THREE.CapsuleGeometry(MODEL.leg.radius * 0.9, MODEL.leg.lowerLength, MODEL.torso.segments, MODEL.head.segments),
            bottomMat
        );
        lower.position.y = MODEL.leg.lowerPositionY;
        applyShadow(lower);

        const foot = new THREE.Mesh(
            new THREE.BoxGeometry(MODEL.leg.footWidth, MODEL.leg.footHeight, MODEL.leg.footDepth),
            shoeMat
        );
        foot.position.y = MODEL.leg.lowerPositionY - (MODEL.leg.lowerLength * MODEL.leg.footDropFactor) - MODEL.leg.footHeight * MODEL.leg.footHeightOffset;
        foot.position.z = MODEL.leg.footDepth * MODEL.leg.footForwardFactor;
        applyShadow(foot);

        leg.add(upper, lower, foot);
        return leg;
    }

    _buildAccessories(type, accentMat, topMat) {
        if (type === 'badge') {
            const badge = new THREE.Mesh(
                new THREE.CylinderGeometry(MODEL.accessories.badgeRadius, MODEL.accessories.badgeRadius, MODEL.accessories.badgeDepth, MODEL.head.segments),
                accentMat
            );
            badge.rotation.x = MODEL.accessories.badgeRotationX;
            badge.position.set(
                MODEL.accessories.badgeOffsetX,
                MODEL.accessories.badgeOffsetY,
                MODEL.accessories.badgeOffsetZ
            );
            applyShadow(badge);
            return badge;
        }
        if (type === 'backpack') {
            const backpack = new THREE.Mesh(
                new THREE.BoxGeometry(
                    MODEL.accessories.backpackWidth,
                    MODEL.accessories.backpackHeight,
                    MODEL.accessories.backpackDepth
                ),
                topMat
            );
            backpack.position.set(0, MODEL.accessories.backpackOffsetY, MODEL.accessories.backpackOffsetZ);
            applyShadow(backpack);
            return backpack;
        }
        return null;
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
