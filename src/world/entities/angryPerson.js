import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

const _tempTargetPos = new THREE.Vector3();
const _tempForward = new THREE.Vector3();
const _tempDir = new THREE.Vector3();
const GRAVITY = new THREE.Vector3(0, -9.8, 0);

// Shared geometry and material for projectiles to avoid allocation per throw
const PROJECTILE_GEO = new THREE.IcosahedronGeometry(0.15, 0);
const PROJECTILE_MAT = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

const STYLES = [
    { name: 'Classic', pants: 0x111199, shirt: 0xcc0000, skin: 0xffccaa }, // Blue pants, Red shirt
    { name: 'Business', pants: 0x333333, shirt: 0xffffff, skin: 0xffdbac, tie: true }, // Grey/Black pants, White shirt
    { name: 'Worker', pants: 0x2244aa, shirt: 0xff6600, skin: 0xe0ac69, hat: 0xffff00 }, // Blue pants, Orange shirt, Yellow hat
    { name: 'Goth', pants: 0x111111, shirt: 0x222222, skin: 0xf0f0f0 }, // All black, pale skin
    { name: 'Summer', pants: 0xddccaa, shirt: 0x00ccff, skin: 0x8d5524 }, // Khaki pants, Cyan shirt
    { name: 'Farmer', pants: 0x223377, shirt: 0xcccc55, skin: 0xf1c27d, hat: 0x886633 }, // Overalls blue, dull shirt, brown hat
    { name: 'Sporty', pants: 0x111111, shirt: 0x333333, skin: 0xffccaa, stripes: true }, // Tracksuit
    { name: 'Doctor', pants: 0xffffff, shirt: 0x99ddff, skin: 0xffdbac } // White pants, Light blue shirt
];

export class AngryPersonEntity extends BaseEntity {
    constructor(params = {}) {
        // Defaults
        if (params.appearance === undefined) params.appearance = Math.floor(Math.random() * STYLES.length);
        if (params.throwInterval === undefined) params.throwInterval = 3.0;
        if (params.firingRange === undefined) params.firingRange = 10;

        super(params);
        this.type = 'angryPerson';
        this.projectiles = [];
        this.cooldown = 0;
    }

    createMesh(params) {
        const styleIndex = params.appearance !== undefined ? params.appearance : 0;
        const style = STYLES[styleIndex % STYLES.length];

        const group = new THREE.Group();

        // 1. Pants (Cylinder)
        const pantsGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12);
        const pantsMat = new THREE.MeshStandardMaterial({ color: style.pants, roughness: 0.9 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.45;
        pants.castShadow = true;
        group.add(pants);

        // 2. Torso (Cylinder)
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.6, 12);
        const torsoMat = new THREE.MeshStandardMaterial({ color: style.shirt, roughness: 0.9 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.9 + 0.3; // 1.2
        torso.castShadow = true;
        group.add(torso);

        // Add Tie for Business
        if (style.tie) {
            const tieGeo = new THREE.BoxGeometry(0.1, 0.4, 0.05);
            const tieMat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(0, 1.2, 0.25);
            tie.castShadow = true;
            group.add(tie);
        }

        // 3. Head (Sphere + Face Texture)
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: style.skin });

        // Procedural Face Texture
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Skin background
        const c = new THREE.Color(style.skin);
        ctx.fillStyle = '#' + c.getHexString();
        ctx.fillRect(0, 0, 128, 128);

        // Angry Eyebrows
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Left (slanted down)
        ctx.moveTo(30, 45); ctx.lineTo(55, 55);
        // Right (slanted down)
        ctx.moveTo(98, 45); ctx.lineTo(73, 55);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(45, 60, 5, 0, Math.PI * 2);
        ctx.arc(83, 60, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (Frown)
        ctx.strokeStyle = '#aa0000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(64, 100, 15, Math.PI + 0.2, -0.2); // Frown arc
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        headMat.map = tex;

        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5 + 0.25; // 1.75
        // Rotate so face looks forward (+Z)
        head.rotation.y = -Math.PI / 2;
        head.castShadow = true;
        group.add(head);

        // Hat Logic
        if (style.hat) {
            const hatGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
            const hatMat = new THREE.MeshStandardMaterial({ color: style.hat });
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.y = 2.0;
            hat.castShadow = true;
            group.add(hat);

            // Brim for Farmer
            if (style.name === 'Farmer') {
                 const brimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.02, 12);
                 const brim = new THREE.Mesh(brimGeo, hatMat);
                 brim.position.y = 1.95;
                 group.add(brim);
            }
        }

        // 4. Arms (Raised in anger)
        const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);

        const armLeft = new THREE.Mesh(armGeo, torsoMat);
        armLeft.position.set(0.35, 1.45, 0.1);
        armLeft.rotation.z = -0.3; // Flared out
        armLeft.rotation.x = -0.8; // Raised forward
        armLeft.castShadow = true;
        group.add(armLeft);

        const armRight = new THREE.Mesh(armGeo, torsoMat);
        armRight.position.set(-0.35, 1.45, 0.1);
        armRight.rotation.z = 0.3;
        armRight.rotation.x = -0.8;
        armRight.castShadow = true;
        group.add(armRight);

        // Composite shadow properties
        group.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        return group;
    }

    update(dt) {
        // Access global app for game state (Drone, Physics)
        if (!window.app || !window.app.drone) return;

        const drone = window.app.drone;

        // 1. Behavior Logic
        const dist = this.mesh.position.distanceTo(drone.position);

        // Look at drone if relatively close
        if (dist < 40) {
            // Keep upright, rotate Y only
            _tempTargetPos.set(drone.position.x, this.mesh.position.y, drone.position.z);
            this.mesh.lookAt(_tempTargetPos);
        }

        // Get firing range and interval from params
        const range = parseFloat(this.params.firingRange) || 10;
        const interval = parseFloat(this.params.throwInterval) || 3.0;

        if (this.cooldown > 0) this.cooldown -= dt;

        if (dist <= range && this.cooldown <= 0) {
            this.throwObject(drone);
            this.cooldown = interval;
        }

        // 2. Projectile Logic
        this._updateProjectiles(dt, drone);
    }

    throwObject(target) {
        // Create Projectile Mesh (Rock/Box)
        // OPTIMIZATION: Use shared geometry and material to avoid allocation per projectile
        const mesh = new THREE.Mesh(PROJECTILE_GEO, PROJECTILE_MAT);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Start Position: Above head, slightly forward
        mesh.position.copy(this.mesh.position);
        mesh.position.y += 2.0;
        _tempForward.set(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        mesh.position.addScaledVector(_tempForward, 0.5);

        // Velocity Calculation: Arc towards target
        _tempDir.subVectors(target.position, mesh.position);
        const dist = _tempDir.length();
        _tempDir.normalize();

        const baseSpeed = 10;
        const velocity = _tempDir.clone().multiplyScalar(baseSpeed);
        // Add upward arc: proportional to distance
        velocity.y += 3 + (dist * 0.15);

        // Add random variation
        velocity.x += (Math.random() - 0.5) * 1.0;
        velocity.z += (Math.random() - 0.5) * 1.0;

        // Add to Scene
        if (window.app.renderer && window.app.renderer.scene) {
            window.app.renderer.scene.add(mesh);
            this.projectiles.push({
                mesh: mesh,
                velocity: velocity,
                life: 10.0, // Auto-delete after 10s
                radius: 0.15
            });
        }
    }

    _updateProjectiles(dt, drone) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Lifecycle
            p.life -= dt;
            if (p.life <= 0) {
                this._removeProjectile(i);
                continue;
            }

            // Physics integration
            p.velocity.addScaledVector(GRAVITY, dt);
            p.mesh.position.addScaledVector(p.velocity, dt);

            // Spin effect
            p.mesh.rotation.x += dt * 5;
            p.mesh.rotation.z += dt * 5;

            // 1. Check Drone Collision
            if (p.mesh.position.distanceTo(drone.position) < (0.5 + p.radius)) {
                // Impact!
                if (window.app.audio) window.app.audio.playImpact();
                if (window.app.particles) window.app.particles.emit(p.mesh.position, 5, 0xaaaaaa);

                // Battery Drain
                if (drone.battery) {
                    drone.battery.current -= 10;
                    if (drone.battery.current < 0) drone.battery.current = 0;
                }

                this._removeProjectile(i);
                continue;
            }

            // 2. Check World Collision
            if (window.app.colliderSystem) {
                const hits = window.app.colliderSystem.checkCollisions(p.mesh.position, p.radius);
                if (hits.length > 0) {
                    // Hit wall/ground
                    if (window.app.particles) window.app.particles.emit(p.mesh.position, 3, 0x555555);
                    this._removeProjectile(i);
                    continue;
                }
            }

            // 3. Fallback Ground Check (y < 0)
            if (p.mesh.position.y < p.radius) {
                this._removeProjectile(i);
                continue;
            }
        }
    }

    _removeProjectile(index) {
        const p = this.projectiles[index];
        if (p.mesh.parent) {
            p.mesh.parent.remove(p.mesh);
        }
        // OPTIMIZATION: Do not dispose shared geometry/material
        // if (p.mesh.geometry) p.mesh.geometry.dispose();
        this.projectiles.splice(index, 1);
    }

    // Explicit static getter for Palette
    static get displayName() {
        return 'Angry Person';
    }
}

// Auto-register
EntityRegistry.register('angryPerson', AngryPersonEntity);
