// src/fx/particles.js
import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.pool = [];
        this.maxParticles = 500;

        // Shared Geometry
        this.geo = new THREE.PlaneGeometry(0.2, 0.2);
        this.mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 });

        this._initPool();
    }

    _initPool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const mesh = new THREE.Mesh(this.geo, this.mat.clone());
            mesh.visible = false;
            this.scene.add(mesh);
            this.pool.push({
                mesh: mesh,
                active: false,
                life: 0,
                velocity: new THREE.Vector3()
            });
        }
    }

    emit(pos, count, color) {
        for (let i = 0; i < count; i++) {
            const p = this._getFreeParticle();
            if (!p) return;

            p.active = true;
            p.life = 1.0;
            p.mesh.visible = true;
            p.mesh.position.copy(pos);
            p.mesh.material.color.setHex(color);
            p.mesh.material.opacity = 1.0;

            // Random velocity
            p.velocity.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );
        }
    }

    _getFreeParticle() {
        return this.pool.find(p => !p.active);
    }

    update(dt) {
        this.pool.forEach(p => {
            if (!p.active) return;

            p.life -= dt * 2.0; // 0.5s life
            if (p.life <= 0) {
                p.active = false;
                p.mesh.visible = false;
            } else {
                p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
                p.mesh.material.opacity = p.life;
                p.mesh.lookAt(this.scene.position); // Billboarding (approx)
            }
        });
    }
}
