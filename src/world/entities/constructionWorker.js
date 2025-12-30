import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempVec = new THREE.Vector3();

/**
 * Construction Worker Entity
 * A static NPC that performs a jackhammer animation and emits dust particles.
 */
export class ConstructionWorkerEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'constructionWorker';
        this.state = params.state || 'working'; // 'working', 'idle'
        this.vestColor = params.vestColor !== undefined ? params.vestColor : 0xff6600; // Default Orange
        this.timer = Math.random() * 100; // Random offset
    }

    /**
     * Creates the composite mesh for the worker.
     */
    createMesh(params) {
        const group = new THREE.Group();

        // Colors
        // Allow params to override constructor defaults if passed directly to createMesh (though BaseEntity passes params to constructor)
        const vestColor = params.vestColor !== undefined ? params.vestColor : this.vestColor;
        const pantsColor = 0x2244aa; // Blue jeans
        const skinColor = 0xe0ac69;
        const hatColor = 0xffff00; // Yellow

        // 1. Legs (Cylinder)
        const pantsGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12);
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.45;
        pants.castShadow = true;
        pants.receiveShadow = true;
        group.add(pants);

        // 2. Torso (Cylinder - Vest)
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.6, 12);
        const torsoMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.9 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.9 + 0.3; // 1.2
        torso.castShadow = true;
        torso.receiveShadow = true;
        group.add(torso);

        // Reflective Strips (Torus simulation via thin cylinders)
        const stripGeo = new THREE.CylinderGeometry(0.29, 0.27, 0.05, 12);
        const stripMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222 });

        const strip1 = new THREE.Mesh(stripGeo, stripMat);
        strip1.position.y = 1.1;
        group.add(strip1);

        const strip2 = new THREE.Mesh(stripGeo, stripMat);
        strip2.position.y = 1.35;
        group.add(strip2);

        // 3. Head (Sphere)
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: skinColor });
        // Add simple face texture (Grime/Beard)
        headMat.map = this._createFaceTexture(skinColor);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.rotation.y = -Math.PI / 2; // Face forward
        head.castShadow = true;
        group.add(head);

        // 4. Hard Hat
        const hatGroup = new THREE.Group();
        const hatDomeGeo = new THREE.SphereGeometry(0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.3, metalness: 0.1 });
        const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
        hatGroup.add(hatDome);

        const hatBrimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 12);
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 0;
        hatGroup.add(hatBrim);

        hatGroup.position.y = 1.95;
        hatGroup.castShadow = true;
        group.add(hatGroup);

        // 5. Arms (Holding Jackhammer)
        const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        const armLeft = new THREE.Mesh(armGeo, torsoMat);
        armLeft.position.set(0.35, 1.45, 0.2);
        armLeft.rotation.x = -0.5;
        armLeft.rotation.z = -0.2;
        armLeft.castShadow = true;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, torsoMat);
        armRight.position.set(-0.35, 1.45, 0.2);
        armRight.rotation.x = -0.5;
        armRight.rotation.z = 0.2;
        armRight.castShadow = true;
        group.add(armRight);

        // 6. Jackhammer
        const jackhammer = this._createJackhammer();
        jackhammer.position.set(0, 0, 0.5);
        jackhammer.rotation.x = -0.2;
        group.add(jackhammer);

        // Cache for animation
        group.userData.jackhammer = jackhammer;

        return group;
    }

    _createFaceTexture(skinHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const c = new THREE.Color(skinHex);

        // Background
        ctx.fillStyle = '#' + c.getHexString();
        ctx.fillRect(0, 0, 64, 64);

        // Grime/Stubble
        ctx.fillStyle = 'rgba(60, 50, 40, 0.2)';
        for(let i=0; i<20; i++) {
             const x = Math.random() * 64;
             const y = 32 + Math.random() * 32;
             ctx.fillRect(x, y, 2, 2);
        }

        // Eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(24, 28, 3, 0, Math.PI*2);
        ctx.arc(40, 28, 3, 0, Math.PI*2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _createJackhammer() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.5 });
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.8 });

        // Main Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), mat);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);

        // Handles
        const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), silverMat);
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.y = 1.1;
        handleBar.castShadow = true;
        group.add(handleBar);

        // Bit
        const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.01, 0.6, 8), silverMat);
        bit.position.y = 0.3;
        bit.castShadow = true;
        group.add(bit);

        return group;
    }

    update(dt) {
        if (!this.mesh) return;

        this.timer += dt;

        if (this.state === 'working') {
            // Vibrate vertically
            // High frequency (40), low amplitude (0.015)
            const vibration = Math.sin(this.timer * 40) * 0.015;

            // Oscillate around the entity's logical position
            this.mesh.position.y = this.position.y + vibration;

            // Dust particles logic
            // Check if particle system exists
            if (window.app && window.app.particles) {
                 // Emit roughly every 0.3 seconds (30% chance per frame at 60fps is too high, use timer mod or rand)
                 // Let's use random for organic feel
                 if (Math.random() < dt * 3) {
                     _tempVec.copy(this.mesh.position);
                     // Offset to front where jackhammer is
                     const forwardOffset = 0.6;
                     // Rotate offset by entity rotation
                     const forward = new THREE.Vector3(0, 0, forwardOffset).applyQuaternion(this.mesh.quaternion);
                     _tempVec.add(forward);

                     // Random spread
                     _tempVec.x += (Math.random() - 0.5) * 0.4;
                     _tempVec.z += (Math.random() - 0.5) * 0.4;

                     // Gray/Brown dust
                     window.app.particles.emit(_tempVec, 3 + Math.random() * 3, 0x887766);
                 }
            }
        }
    }

    static get displayName() {
        return 'Construction Worker';
    }
}

EntityRegistry.register('constructionWorker', ConstructionWorkerEntity);
