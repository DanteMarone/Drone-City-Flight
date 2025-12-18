import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const WARM_GLOW = 0xffd479;

export class FireflyLanternEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'fireflyLantern';
        this._time = Math.random() * Math.PI * 2;
        this._fireflies = [];
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._jarPivot = null;
    }

    static get displayName() { return 'Firefly Lantern'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseTex = TextureGenerator.createConcrete();
        baseTex.wrapS = THREE.RepeatWrapping;
        baseTex.wrapT = THREE.RepeatWrapping;
        baseTex.repeat.set(1.5, 1.5);

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.65, 0.16, 16),
            new THREE.MeshStandardMaterial({
                color: 0x767c86,
                map: baseTex,
                roughness: 0.85,
                metalness: 0.15
            })
        );
        base.position.y = 0.08;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        const poleHeight = params.poleHeight || 2.2;
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.09, poleHeight, 14),
            new THREE.MeshStandardMaterial({ color: 0x4b3b2b, roughness: 0.5, metalness: 0.25 })
        );
        pole.position.y = poleHeight / 2 + base.position.y;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        const armLength = 0.9;
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(armLength, 0.12, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x3b2f23, roughness: 0.55, metalness: 0.2 })
        );
        arm.position.set(armLength / 2 + 0.04, pole.position.y + poleHeight / 2 - 0.2, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);

        const hook = new THREE.Mesh(
            new THREE.TorusGeometry(0.14, 0.018, 8, 32, Math.PI * 1.3),
            new THREE.MeshStandardMaterial({ color: 0x2f231a, roughness: 0.6, metalness: 0.2 })
        );
        hook.rotation.set(Math.PI / 2, 0, Math.PI * 0.1);
        hook.position.set(arm.position.x + armLength / 2 - 0.1, arm.position.y - 0.05, 0);
        hook.castShadow = true;
        group.add(hook);

        const jarPivot = new THREE.Group();
        jarPivot.position.set(hook.position.x + 0.05, hook.position.y - 0.14, 0);
        group.add(jarPivot);
        this._jarPivot = jarPivot;

        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe2ae,
            transparent: true,
            opacity: 0.28,
            roughness: 0.08,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 24, 1, true), glassMaterial);
        jarBody.position.y = 0.22;
        jarBody.castShadow = false;
        jarBody.receiveShadow = true;
        jarPivot.add(jarBody);

        const jarBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.23, 0.24, 0.06, 20),
            new THREE.MeshStandardMaterial({ color: 0xd1c6b1, roughness: 0.4, metalness: 0.15 })
        );
        jarBase.position.y = 0.03;
        jarBase.castShadow = true;
        jarBase.receiveShadow = true;
        jarPivot.add(jarBase);

        const lid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.22, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0x3c3b3a, roughness: 0.35, metalness: 0.6 })
        );
        lid.position.y = 0.46;
        lid.castShadow = true;
        jarPivot.add(lid);

        const rope = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.01, 6, 18),
            new THREE.MeshStandardMaterial({ color: 0x9f8663, roughness: 0.7, metalness: 0.1 })
        );
        rope.rotation.x = Math.PI / 2;
        rope.position.y = lid.position.y + 0.03;
        jarPivot.add(rope);

        const fireflyGroup = new THREE.Group();
        fireflyGroup.position.y = 0.18;
        jarPivot.add(fireflyGroup);

        const fireflyCount = 7;
        for (let i = 0; i < fireflyCount; i++) {
            const radius = 0.14 + Math.random() * 0.06;
            const height = 0.05 + Math.random() * 0.1;
            const speed = 1.2 + Math.random() * 0.8;
            const phase = Math.random() * Math.PI * 2;

            const fireflyMat = new THREE.MeshStandardMaterial({
                color: WARM_GLOW,
                emissive: new THREE.Color(WARM_GLOW),
                emissiveIntensity: 0.8,
                roughness: 0.25,
                metalness: 0.1
            });

            const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), fireflyMat);
            firefly.position.set(
                Math.cos(phase) * radius,
                height,
                Math.sin(phase) * radius
            );
            firefly.castShadow = false;
            fireflyGroup.add(firefly);

            this._fireflies.push({
                mesh: firefly,
                radius,
                height,
                speed,
                phase
            });
        }

        this._lightAnchor.set(jarPivot.position.x, jarPivot.position.y + 0.18, jarPivot.position.z);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle = lightSystem.register(worldPos, WARM_GLOW, 1.6, 10);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        for (let i = 0; i < this._fireflies.length; i++) {
            const data = this._fireflies[i];
            const angle = data.phase + this._time * data.speed;
            const bob = Math.sin(this._time * 2 + data.phase) * 0.04;
            data.mesh.position.set(
                Math.cos(angle) * data.radius,
                data.height + bob,
                Math.sin(angle) * data.radius
            );
            data.mesh.material.emissiveIntensity = 0.7 + Math.abs(Math.sin(this._time * 3 + data.phase)) * 0.6;
        }

        if (this._lightHandle && this.mesh) {
            const pulse = 0.2 + Math.sin(this._time * 1.8) * 0.15;
            this._lightHandle.intensity = 1.3 + pulse;
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            this._lightHandle.position.copy(worldPos);
        }
    }
}

EntityRegistry.register('fireflyLantern', FireflyLanternEntity);
