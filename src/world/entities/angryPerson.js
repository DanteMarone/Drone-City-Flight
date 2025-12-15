import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class AngryPersonEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'angryPerson';
        this.projectiles = [];
        this.cooldown = 0;
        this.fireRate = 3.0; // Seconds

        // Ensure firingRange is set in params (default 10)
        if (this.params.firingRange === undefined) {
            this.params.firingRange = 10;
        }
    }

    createMesh(params) {
        const group = new THREE.Group();

        // 1. Pants (Blue Cylinder)
        const pantsGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 12);
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x111199, roughness: 0.9 });
        const pants = new THREE.Mesh(pantsGeo, pantsMat);
        pants.position.y = 0.45;
        pants.castShadow = true;
        group.add(pants);

        // 2. Torso (Red Shirt Cylinder)
        const torsoGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.6, 12);
        const torsoMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.9 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.9 + 0.3; // 1.2
        torso.castShadow = true;
        group.add(torso);

        // 3. Head (Sphere + Face Texture)
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });

        // Procedural Face Texture
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Skin background
        ctx.fillStyle = '#ffccaa';
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
        // Default sphere mapping wraps around. We usually need to adjust rotation.
        // Let's assume -PI/2 aligns the texture center to +Z or similar.
        head.rotation.y = -Math.PI / 2;
        head.castShadow = true;
        group.add(head);

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
            const targetPos = new THREE.Vector3(drone.position.x, this.mesh.position.y, drone.position.z);
            this.mesh.lookAt(targetPos);
        }

        // Get firing range from params (editable in DevMode)
        const range = parseFloat(this.params.firingRange) || 10;

        if (this.cooldown > 0) this.cooldown -= dt;

        if (dist <= range && this.cooldown <= 0) {
            this.throwObject(drone);
            this.cooldown = this.fireRate;
        }

        // 2. Projectile Logic
        this._updateProjectiles(dt, drone);
    }

    throwObject(target) {
        // Create Projectile Mesh (Rock/Box)
        const geo = new THREE.IcosahedronGeometry(0.15, 0); // Low poly rock
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Start Position: Above head, slightly forward
        mesh.position.copy(this.mesh.position);
        mesh.position.y += 2.0;
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        mesh.position.addScaledVector(forward, 0.5);

        // Velocity Calculation: Arc towards target
        // V = Direction * Speed + Upward component
        const dir = new THREE.Vector3().subVectors(target.position, mesh.position);
        const dist = dir.length();
        dir.normalize();

        // Heuristic for aiming:
        // Speed proportional to distance? Or fixed?
        // Let's use a base speed and add some height compensation
        const baseSpeed = 10;
        const velocity = dir.multiplyScalar(baseSpeed);
        // Add upward arc: proportional to distance so it reaches
        // Simple Physics: t = dist/speed. h = 0.5*g*t^2.
        // We just add impulse.
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
        const gravity = new THREE.Vector3(0, -9.8, 0);

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Lifecycle
            p.life -= dt;
            if (p.life <= 0) {
                this._removeProjectile(i);
                continue;
            }

            // Physics integration
            p.velocity.addScaledVector(gravity, dt);
            p.mesh.position.addScaledVector(p.velocity, dt);

            // Spin effect
            p.mesh.rotation.x += dt * 5;
            p.mesh.rotation.z += dt * 5;

            // 1. Check Drone Collision
            // Drone radius approx 0.5m. Projectile radius 0.15m.
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
                // Use radius slightly larger than visual to ensure clean hits
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
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        // Material might be shared, be careful.
        this.projectiles.splice(index, 1);
    }

    // Explicit static getter for Palette
    static get displayName() {
        return 'Angry Person';
    }
}

// Auto-register
EntityRegistry.register('angryPerson', AngryPersonEntity);
