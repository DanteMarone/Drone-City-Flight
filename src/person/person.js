// src/person/person.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { damp } from '../utils/math.js';
import { LifeManager } from './life.js';

const STYLES = [
    { name: 'Casual', shirtColors: [0x3b82f6, 0xff5555, 0x55aa55, 0xffaa00], pantsColors: [0x111199, 0x333333, 0xddccaa] },
    { name: 'Sporty', shirtColors: [0x111111, 0xffffff], pantsColors: [0x111111, 0x555555] },
    { name: 'Formal', shirtColors: [0xffffff, 0x99ccff], pantsColors: [0x111111, 0x222244] }
];

const SKIN_TONES = [0xffdbac, 0xf1c27d, 0xe0ac69, 0x8d5524, 0x613e1e];

export class Person {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.grounded = false;
        this.life = new LifeManager();

        this.mesh = new THREE.Group();
        this.randomizeAppearance(); // Generate initial appearance traits
        this._buildMesh();
        this.scene.add(this.mesh);
    }

    randomizeAppearance() {
        // Randomize Body Shape
        this.heightScale = 0.95 + Math.random() * 0.1; // 0.95 - 1.05
        this.widthScale = 0.9 + Math.random() * 0.2;   // 0.9 - 1.1

        // Randomize Colors
        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        this.shirtColor = style.shirtColors[Math.floor(Math.random() * style.shirtColors.length)];
        this.pantsColor = style.pantsColors[Math.floor(Math.random() * style.pantsColors.length)];
        this.skinColor = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];

        // Randomize Accessories
        this.hasHat = Math.random() < 0.3;
        this.hatColor = Math.random() < 0.5 ? 0x333333 : style.shirtColors[0]; // Match shirt or dark
        this.hairColor = [0x000000, 0x4a3218, 0x754818, 0xcccc55, 0x999999][Math.floor(Math.random() * 5)];
    }

    _buildMesh() {
        // Dispose existing resources if any
        this._disposeMesh();

        const shirtMat = new THREE.MeshStandardMaterial({ color: this.shirtColor, roughness: 0.7 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: this.pantsColor, roughness: 0.8 });
        const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.6 });
        const hairMat = new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.9 });

        const group = new THREE.Group();

        // 1. Legs (Separate)
        const legGeo = new THREE.CylinderGeometry(0.11 * this.widthScale, 0.1 * this.widthScale, 0.75 * this.heightScale, 12);

        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(-0.15 * this.widthScale, 0.375 * this.heightScale, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(0.15 * this.widthScale, 0.375 * this.heightScale, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        group.add(rightLeg);

        // 2. Torso
        const torsoHeight = 0.65 * this.heightScale;
        const torsoGeo = new THREE.BoxGeometry(0.5 * this.widthScale, torsoHeight, 0.25);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        // Positioned on top of legs (leg height ~0.75)
        // Center of torso is at 0.75 + half torso height
        torso.position.y = (0.75 * this.heightScale) + (torsoHeight / 2);
        torso.castShadow = true;
        torso.receiveShadow = true;
        group.add(torso);

        // 3. Arms
        const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.6, 12);
        const armLeft = new THREE.Mesh(armGeo, shirtMat);
        armLeft.position.set(-(0.25 * this.widthScale + 0.12), torso.position.y + 0.1, 0);
        armLeft.rotation.z = 0.2; // Slight A-pose
        armLeft.castShadow = true;
        armLeft.receiveShadow = true;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, shirtMat);
        armRight.position.set((0.25 * this.widthScale + 0.12), torso.position.y + 0.1, 0);
        armRight.rotation.z = -0.2;
        armRight.castShadow = true;
        armRight.receiveShadow = true;
        group.add(armRight);

        // Hands (Skin)
        const handGeo = new THREE.SphereGeometry(0.09, 8, 8);
        const handLeft = new THREE.Mesh(handGeo, skinMat);
        handLeft.position.set(0, -0.35, 0); // Relative to arm
        handLeft.castShadow = true;
        handLeft.receiveShadow = true;
        armLeft.add(handLeft); // Child of arm

        const handRight = new THREE.Mesh(handGeo, skinMat);
        handRight.position.set(0, -0.35, 0);
        handRight.castShadow = true;
        handRight.receiveShadow = true;
        armRight.add(handRight);

        // 4. Head
        const headSize = 0.22;
        const headGeo = new THREE.SphereGeometry(headSize, 16, 16);

        // Face Texture
        const faceTex = this._createFaceTexture(this.skinColor);
        const headMat = new THREE.MeshStandardMaterial({ color: this.skinColor, map: faceTex, roughness: 0.5 });

        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = torso.position.y + (torsoHeight / 2) + headSize;
        head.rotation.y = -Math.PI / 2; // Face forward
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        // 5. Hair or Hat
        if (this.hasHat) {
            const hatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
            const hatMat = new THREE.MeshStandardMaterial({ color: this.hatColor });
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.y = 0.15; // Relative to head
            hat.castShadow = true;
            hat.receiveShadow = true;
            head.add(hat);

            // Brim
            const brimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 16);
            const brim = new THREE.Mesh(brimGeo, hatMat);
            brim.position.y = -0.05;
            brim.castShadow = true;
            brim.receiveShadow = true;
            hat.add(brim);
        } else {
            // Simple Hair (Top half sphere, scaled)
            const hairGeo = new THREE.SphereGeometry(headSize * 1.05, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const hair = new THREE.Mesh(hairGeo, hairMat);
            hair.position.y = 0.02;
            hair.rotation.x = 0; // Top
            hair.castShadow = true;
            hair.receiveShadow = true;
            head.add(hair);
        }

        this.mesh.add(group);
    }

    _createFaceTexture(skinHex) {
        if (typeof document === 'undefined') return null; // Safety for non-browser envs

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background (Skin)
        const c = new THREE.Color(skinHex);
        ctx.fillStyle = '#' + c.getHexString();
        ctx.fillRect(0, 0, 128, 128);

        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(40, 55, 6, 0, Math.PI * 2); // Left Eye
        ctx.arc(88, 55, 6, 0, Math.PI * 2); // Right Eye
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#553333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 70, 20, 0.2, Math.PI - 0.2);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _disposeMesh() {
        if (!this.mesh) return;

        // Recursively dispose geometry and material
        this.mesh.traverse((obj) => {
            if (obj.isMesh) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (obj.material.map) obj.material.map.dispose();
                        obj.material.dispose();
                    }
                }
            }
        });

        // Clear children
        while(this.mesh.children.length > 0){
            this.mesh.remove(this.mesh.children[0]);
        }
    }

    dispose() {
        this._disposeMesh();
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
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
