// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const APPEARANCE_OPTIONS = {
    skinTones: [
        0xf5d7c4,
        0xf0c4a8,
        0xe8b48f,
        0xd8a07b,
        0xc6876a,
        0xb6765c,
        0x9d5f45,
        0x8a4c3a,
        0x733b2f
    ],
    hairColors: [
        0x2f1b0c,
        0x4b2a1a,
        0x704332,
        0x8c5a3c,
        0xb07a57,
        0x1f1f1f,
        0x4a4a4a,
        0xbfa37c
    ],
    tops: [
        0x3b82f6,
        0x0ea5e9,
        0x22c55e,
        0xf97316,
        0xef4444,
        0xa855f7,
        0x14b8a6,
        0xfacc15
    ],
    bottoms: [
        0x111827,
        0x1f2937,
        0x334155,
        0x374151,
        0x475569,
        0x4b5563
    ],
    accents: [
        0xffffff,
        0xf8fafc,
        0xe2e8f0,
        0x94a3b8
    ],
    accessories: ['none', 'beanie', 'cap', 'headset', 'glasses']
};

const BODY_PROFILES = [
    { label: 'slender', torsoScale: new THREE.Vector3(0.9, 0.95, 0.85), limbScale: 0.9, shoulderWidth: 0.36 },
    { label: 'athletic', torsoScale: new THREE.Vector3(1.0, 1.0, 0.95), limbScale: 1.0, shoulderWidth: 0.42 },
    { label: 'stocky', torsoScale: new THREE.Vector3(1.15, 1.05, 1.1), limbScale: 1.05, shoulderWidth: 0.46 }
];

const HEAD_PROFILES = [
    { geometry: 'sphere', scale: new THREE.Vector3(1, 1.02, 1) },
    { geometry: 'sphere', scale: new THREE.Vector3(0.95, 1.1, 0.95) },
    { geometry: 'icosa', scale: new THREE.Vector3(1.05, 0.95, 1.05) }
];

const MODEL_DIMENSIONS = {
    footHeight: 0.08,
    footLength: 0.24,
    footWidth: 0.14,
    legUpper: 0.34,
    legLower: 0.3,
    legRadius: 0.09,
    hipHeight: 0.12,
    hipWidth: 0.32,
    torsoHeight: 0.55,
    torsoRadius: 0.22,
    torsoDepth: 0.22,
    shoulderOffsetY: 0.48,
    armUpper: 0.26,
    armLower: 0.24,
    armRadius: 0.06,
    handRadius: 0.06,
    neckHeight: 0.06,
    headRadius: 0.18,
    eyeRadius: 0.025,
    eyeSpacing: 0.09,
    noseLength: 0.06,
    backpackDepth: 0.12
};

const MATERIAL_DEFAULTS = {
    roughness: 0.55,
    metalness: 0.05
};

const pickRandom = (options) => options[Math.floor(Math.random() * options.length)];

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();

        this.mesh = new THREE.Group();
        this.randomizeAppearance();
        this.scene.add(this.mesh);
    }

    randomizeAppearance() {
        this.appearance = this._generateAppearance();
        this._buildMesh();
    }

    _generateAppearance() {
        const profile = pickRandom(BODY_PROFILES);
        const headProfile = pickRandom(HEAD_PROFILES);

        return {
            bodyProfile: profile,
            headProfile,
            skinTone: pickRandom(APPEARANCE_OPTIONS.skinTones),
            hairColor: pickRandom(APPEARANCE_OPTIONS.hairColors),
            topColor: pickRandom(APPEARANCE_OPTIONS.tops),
            bottomColor: pickRandom(APPEARANCE_OPTIONS.bottoms),
            accentColor: pickRandom(APPEARANCE_OPTIONS.accents),
            accessory: pickRandom(APPEARANCE_OPTIONS.accessories)
        };
    }

    _buildMesh() {
        this._clearMesh();

        const appearance = this.appearance || this._generateAppearance();
        const dims = MODEL_DIMENSIONS;
        const profile = appearance.bodyProfile;

        const skinMat = new THREE.MeshStandardMaterial({
            color: appearance.skinTone,
            roughness: MATERIAL_DEFAULTS.roughness,
            metalness: MATERIAL_DEFAULTS.metalness
        });
        const topMat = new THREE.MeshStandardMaterial({
            color: appearance.topColor,
            roughness: 0.6,
            metalness: 0.05
        });
        const bottomMat = new THREE.MeshStandardMaterial({
            color: appearance.bottomColor,
            roughness: 0.7,
            metalness: 0.05
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: appearance.accentColor,
            roughness: 0.4,
            metalness: 0.1
        });
        const hairMat = new THREE.MeshStandardMaterial({
            color: appearance.hairColor,
            roughness: 0.7,
            metalness: 0.05
        });

        const torsoGroup = new THREE.Group();
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(dims.torsoRadius, dims.torsoHeight, 6, 14), topMat);
        torso.scale.copy(profile.torsoScale);
        torso.position.y = dims.legUpper + dims.legLower + dims.hipHeight + dims.torsoHeight * 0.5;
        torso.castShadow = true;
        torso.receiveShadow = true;
        torsoGroup.add(torso);

        const chestPlate = new THREE.Mesh(
            new THREE.BoxGeometry(dims.torsoRadius * 1.2, dims.torsoHeight * 0.5, dims.torsoDepth * 1.25),
            accentMat
        );
        chestPlate.position.set(0, torso.position.y + 0.08, dims.torsoDepth * 0.1);
        chestPlate.castShadow = true;
        chestPlate.receiveShadow = true;
        torsoGroup.add(chestPlate);

        const backpack = new THREE.Mesh(
            new THREE.BoxGeometry(dims.torsoRadius * 0.9, dims.torsoHeight * 0.6, dims.backpackDepth),
            accentMat
        );
        backpack.position.set(0, torso.position.y + 0.1, -dims.torsoDepth * 0.9);
        backpack.castShadow = true;
        backpack.receiveShadow = true;
        torsoGroup.add(backpack);

        this.mesh.add(torsoGroup);

        const hips = new THREE.Mesh(
            new THREE.BoxGeometry(dims.hipWidth * profile.torsoScale.x, dims.hipHeight, dims.torsoDepth),
            bottomMat
        );
        hips.position.y = dims.legUpper + dims.legLower + dims.hipHeight * 0.5;
        hips.castShadow = true;
        hips.receiveShadow = true;
        this.mesh.add(hips);

        this._buildLeg({ side: 'left', material: bottomMat, shoeMat: accentMat, dims, profile });
        this._buildLeg({ side: 'right', material: bottomMat, shoeMat: accentMat, dims, profile });

        this._buildArm({ side: 'left', material: topMat, skinMat, dims, profile });
        this._buildArm({ side: 'right', material: topMat, skinMat, dims, profile });

        this._buildHead({ skinMat, hairMat, accentMat, dims, appearance });
    }

    _buildLeg({ side, material, shoeMat, dims, profile }) {
        const direction = side === 'left' ? 1 : -1;
        const legGroup = new THREE.Group();

        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(dims.legRadius * profile.limbScale, dims.legRadius * profile.limbScale, dims.legUpper, 12),
            material
        );
        upperLeg.position.set(direction * 0.14, dims.legLower + dims.legUpper * 0.5, 0);
        upperLeg.castShadow = true;
        upperLeg.receiveShadow = true;
        legGroup.add(upperLeg);

        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(dims.legRadius * 0.95 * profile.limbScale, dims.legRadius * profile.limbScale, dims.legLower, 12),
            material
        );
        lowerLeg.position.set(direction * 0.14, dims.legLower * 0.5, 0);
        lowerLeg.castShadow = true;
        lowerLeg.receiveShadow = true;
        legGroup.add(lowerLeg);

        const foot = new THREE.Mesh(
            new THREE.BoxGeometry(dims.footWidth, dims.footHeight, dims.footLength),
            shoeMat
        );
        foot.position.set(direction * 0.14, dims.footHeight * 0.5, dims.footLength * 0.15);
        foot.castShadow = true;
        foot.receiveShadow = true;
        legGroup.add(foot);

        this.mesh.add(legGroup);
    }

    _buildArm({ side, material, skinMat, dims, profile }) {
        const direction = side === 'left' ? 1 : -1;
        const armGroup = new THREE.Group();
        const shoulderX = direction * profile.shoulderWidth;
        const shoulderY = dims.legUpper + dims.legLower + dims.hipHeight + dims.shoulderOffsetY;

        const upperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(dims.armRadius * profile.limbScale, dims.armRadius * profile.limbScale, dims.armUpper, 12),
            material
        );
        upperArm.position.set(shoulderX, shoulderY - dims.armUpper * 0.5, 0);
        upperArm.rotation.z = direction * 0.15;
        upperArm.castShadow = true;
        upperArm.receiveShadow = true;
        armGroup.add(upperArm);

        const forearm = new THREE.Mesh(
            new THREE.CylinderGeometry(dims.armRadius * 0.95 * profile.limbScale, dims.armRadius * profile.limbScale, dims.armLower, 12),
            material
        );
        forearm.position.set(shoulderX, shoulderY - dims.armUpper - dims.armLower * 0.5, 0.02);
        forearm.rotation.z = direction * 0.1;
        forearm.castShadow = true;
        forearm.receiveShadow = true;
        armGroup.add(forearm);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(dims.handRadius, 12, 12), skinMat);
        hand.position.set(shoulderX, shoulderY - dims.armUpper - dims.armLower - dims.handRadius * 0.6, 0.04);
        hand.castShadow = true;
        hand.receiveShadow = true;
        armGroup.add(hand);

        this.mesh.add(armGroup);
    }

    _buildHead({ skinMat, hairMat, accentMat, dims, appearance }) {
        const headGroup = new THREE.Group();
        const headGeometry = appearance.headProfile.geometry === 'icosa'
            ? new THREE.IcosahedronGeometry(dims.headRadius, 2)
            : new THREE.SphereGeometry(dims.headRadius, 18, 18);

        const head = new THREE.Mesh(headGeometry, skinMat);
        head.scale.copy(appearance.headProfile.scale);
        head.position.y = dims.legUpper + dims.legLower + dims.hipHeight + dims.torsoHeight + dims.neckHeight + dims.headRadius;
        head.castShadow = true;
        head.receiveShadow = true;
        headGroup.add(head);

        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(dims.headRadius * 0.35, dims.headRadius * 0.4, dims.neckHeight, 10),
            skinMat
        );
        neck.position.y = head.position.y - dims.headRadius - dims.neckHeight * 0.4;
        neck.castShadow = true;
        neck.receiveShadow = true;
        headGroup.add(neck);

        const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(dims.eyeRadius, 8, 8), eyeWhite);
        leftEye.position.set(dims.eyeSpacing * 0.5, head.position.y + 0.02, dims.headRadius * 0.72);
        const rightEye = leftEye.clone();
        rightEye.position.x = -leftEye.position.x;
        leftEye.castShadow = true;
        rightEye.castShadow = true;
        headGroup.add(leftEye, rightEye);

        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.2 });
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(dims.eyeRadius * 0.45, 8, 8), pupilMat);
        pupil.position.set(leftEye.position.x, leftEye.position.y, leftEye.position.z + 0.02);
        const pupilRight = pupil.clone();
        pupilRight.position.x = rightEye.position.x;
        headGroup.add(pupil, pupilRight);

        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(dims.eyeRadius * 0.8, dims.noseLength, 8),
            skinMat
        );
        nose.position.set(0, head.position.y - 0.02, dims.headRadius * 0.82);
        nose.rotation.x = Math.PI / 2;
        nose.castShadow = true;
        headGroup.add(nose);

        const hair = new THREE.Mesh(
            new THREE.SphereGeometry(dims.headRadius * 1.02, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
            hairMat
        );
        hair.position.set(0, head.position.y + dims.headRadius * 0.2, 0);
        hair.castShadow = true;
        headGroup.add(hair);

        this._addAccessory({ headGroup, accentMat, hairMat, dims, appearance, headY: head.position.y });

        this.mesh.add(headGroup);
    }

    _addAccessory({ headGroup, accentMat, hairMat, dims, appearance, headY }) {
        if (appearance.accessory === 'none') return;

        if (appearance.accessory === 'beanie') {
            const beanie = new THREE.Mesh(
                new THREE.SphereGeometry(dims.headRadius * 1.05, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
                accentMat
            );
            beanie.position.set(0, headY + dims.headRadius * 0.25, 0);
            beanie.castShadow = true;
            headGroup.add(beanie);
            return;
        }

        if (appearance.accessory === 'cap') {
            const cap = new THREE.Mesh(
                new THREE.CylinderGeometry(dims.headRadius * 0.9, dims.headRadius, dims.headRadius * 0.45, 12, 1, true),
                accentMat
            );
            cap.position.set(0, headY + dims.headRadius * 0.35, 0);
            cap.castShadow = true;
            headGroup.add(cap);

            const brim = new THREE.Mesh(
                new THREE.BoxGeometry(dims.headRadius * 1.2, dims.headRadius * 0.08, dims.headRadius * 0.6),
                accentMat
            );
            brim.position.set(0, headY + dims.headRadius * 0.2, dims.headRadius * 0.9);
            brim.castShadow = true;
            headGroup.add(brim);
            return;
        }

        if (appearance.accessory === 'headset') {
            const band = new THREE.Mesh(
                new THREE.TorusGeometry(dims.headRadius * 1.02, dims.headRadius * 0.08, 8, 16, Math.PI),
                accentMat
            );
            band.position.set(0, headY + dims.headRadius * 0.25, 0);
            band.rotation.x = Math.PI / 2;
            band.castShadow = true;
            headGroup.add(band);

            const earPad = new THREE.Mesh(
                new THREE.CylinderGeometry(dims.headRadius * 0.25, dims.headRadius * 0.25, dims.headRadius * 0.2, 10),
                accentMat
            );
            earPad.position.set(dims.headRadius * 1.05, headY, 0);
            earPad.rotation.z = Math.PI / 2;
            earPad.castShadow = true;
            headGroup.add(earPad);

            const earPadRight = earPad.clone();
            earPadRight.position.x = -earPad.position.x;
            headGroup.add(earPadRight);
            return;
        }

        if (appearance.accessory === 'glasses') {
            const lens = new THREE.Mesh(
                new THREE.BoxGeometry(dims.headRadius * 0.35, dims.headRadius * 0.18, dims.headRadius * 0.05),
                hairMat
            );
            lens.position.set(dims.headRadius * 0.45, headY + 0.02, dims.headRadius * 0.86);
            lens.castShadow = true;
            headGroup.add(lens);

            const lensRight = lens.clone();
            lensRight.position.x = -lens.position.x;
            headGroup.add(lensRight);

            const bridge = new THREE.Mesh(
                new THREE.BoxGeometry(dims.headRadius * 0.2, dims.headRadius * 0.06, dims.headRadius * 0.05),
                hairMat
            );
            bridge.position.set(0, headY + 0.02, dims.headRadius * 0.86);
            bridge.castShadow = true;
            headGroup.add(bridge);
        }
    }

    _clearMesh() {
        const disposed = new Set();
        const toRemove = [...this.mesh.children];
        toRemove.forEach(child => {
            child.traverse(obj => {
                if (obj.geometry && !disposed.has(obj.geometry)) {
                    obj.geometry.dispose();
                    disposed.add(obj.geometry);
                }
                if (obj.material) {
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    materials.forEach(mat => {
                        if (!disposed.has(mat)) {
                            mat.dispose();
                            disposed.add(mat);
                        }
                    });
                }
            });
            this.mesh.remove(child);
        });
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
