import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class FireflyLanternEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'fireflyLantern';
        this._time = 0;
        this._jarPivot = null;
        this._lightHandle = null;
        this._lightLocalPos = null;
        this._fireflies = [];
    }

    static get displayName() { return 'Firefly Lantern'; }

    createMesh(params) {
        const group = new THREE.Group();

        // Ground disk with grass texture
        const grassTexture = TextureGenerator.createGrass();
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(2, 2);
        const baseGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.1, 20);
        const baseMat = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.9,
            metalness: 0.05
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        base.receiveShadow = true;
        group.add(base);

        // Wooden stump pedestal
        const stumpHeight = 0.55;
        const stumpGeo = new THREE.CylinderGeometry(0.28, 0.32, stumpHeight, 12);
        const stumpMat = new THREE.MeshStandardMaterial({
            color: 0x6b4c2a,
            roughness: 0.85,
            metalness: 0.05
        });
        const stump = new THREE.Mesh(stumpGeo, stumpMat);
        stump.position.y = base.position.y + stumpHeight * 0.5;
        stump.castShadow = true;
        stump.receiveShadow = true;
        group.add(stump);

        // Bark cap
        const capGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.04, 12);
        const capMat = new THREE.MeshStandardMaterial({
            color: 0x7f5a32,
            roughness: 0.8
        });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = base.position.y + stumpHeight;
        cap.castShadow = true;
        group.add(cap);

        // Jar pivot allows bobbing animation
        const jarPivot = new THREE.Group();
        jarPivot.position.y = cap.position.y + 0.02;
        group.add(jarPivot);
        this._jarPivot = jarPivot;

        // Glass jar body
        const jarHeight = 0.6;
        const jarGeo = new THREE.CylinderGeometry(0.35, 0.33, jarHeight, 14, 1, true);
        const jarMat = new THREE.MeshStandardMaterial({
            color: 0x99c9ff,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const jar = new THREE.Mesh(jarGeo, jarMat);
        jar.position.y = jarHeight * 0.5;
        jar.castShadow = false;
        jar.receiveShadow = false;
        jarPivot.add(jar);

        // Jar rim
        const rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xb6b6b6,
            roughness: 0.35,
            metalness: 0.45
        });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = jar.position.y + jarHeight * 0.5 + 0.02;
        rim.castShadow = true;
        jarPivot.add(rim);

        // Handle loop
        const handleGeo = new THREE.TorusGeometry(0.28, 0.02, 8, 16, Math.PI);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0xb6b6b6,
            roughness: 0.5,
            metalness: 0.55
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI;
        handle.position.y = rim.position.y + 0.06;
        jarPivot.add(handle);

        // Firefly swarm
        const swarm = new THREE.Group();
        swarm.position.y = jar.position.y;
        jarPivot.add(swarm);

        for (let i = 0; i < 9; i++) {
            const size = 0.04 + Math.random() * 0.02;
            const bodyGeo = new THREE.SphereGeometry(size, 8, 8);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x1f1a11,
                emissive: 0xffd34d,
                emissiveIntensity: 1.1,
                roughness: 0.6
            });
            const firefly = new THREE.Mesh(bodyGeo, bodyMat);
            firefly.castShadow = false;
            firefly.receiveShadow = false;

            const radius = 0.12 + Math.random() * 0.14;
            const height = 0.18 + Math.random() * 0.16;
            const speed = 1 + Math.random() * 1.6;
            const phase = Math.random() * Math.PI * 2;
            this._fireflies.push({ mesh: firefly, radius, height, speed, phase });
            swarm.add(firefly);
        }

        // Light anchor (world position registered in postInit)
        this._lightLocalPos = new THREE.Vector3(0, jarPivot.position.y + jarHeight * 0.5, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || (typeof window !== 'undefined' && window.app && window.app.world && window.app.world.lightSystem);
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, 0xffd34d, 2.5, 12);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this._jarPivot || this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        if (this._jarPivot) {
            const bob = Math.sin(this._time * 1.6) * 0.03;
            const sway = Math.sin(this._time * 0.7) * 0.05;
            this._jarPivot.position.y = (this._lightLocalPos ? this._lightLocalPos.y - 0.3 : 0.67) + bob;
            this._jarPivot.rotation.y = sway;
        }

        for (let i = 0; i < this._fireflies.length; i++) {
            const f = this._fireflies[i];
            const t = this._time * f.speed + f.phase;
            const y = 0.15 + Math.sin(t * 1.4) * f.height;
            const x = Math.cos(t) * f.radius;
            const z = Math.sin(t * 1.1) * f.radius;
            f.mesh.position.set(x, y, z);

            const pulse = 0.6 + 0.4 * Math.sin(t * 2.3 + i * 0.6);
            f.mesh.material.emissiveIntensity = 0.8 + pulse;
        }

        if (this._lightHandle) {
            const flicker = 0.35 * Math.sin(this._time * 3.2) + 0.25 * Math.sin(this._time * 7.8);
            this._lightHandle.intensity = Math.max(0.7, 2.5 + flicker);
        }
    }
}

EntityRegistry.register('fireflyLantern', FireflyLanternEntity);
