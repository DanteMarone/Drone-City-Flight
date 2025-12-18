import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

const GOLDEN_YELLOW = 0xe6ff7a;
const MINT_GLOW = 0xb5ff7d;

export class FireflyLanternEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'fireflyLantern';
        this._time = Math.random() * Math.PI * 2;
        this._lightHandle = null;
        this._lightAnchor = new THREE.Vector3();
        this._fireflies = [];
        this._fireflyData = [];
        this._fireflyGroup = null;
        this._baseRotation = this.rotation.clone();
    }

    static get displayName() { return 'Firefly Lantern'; }

    createMesh(params) {
        const group = new THREE.Group();

        const baseRadius = params.baseRadius || 0.5;
        const baseHeight = params.baseHeight || 0.18;
        const poleHeight = params.poleHeight || 1.2;
        const lanternHeight = params.lanternHeight || 0.8;

        const concreteTex = TextureGenerator.createConcrete();
        concreteTex.wrapS = THREE.RepeatWrapping;
        concreteTex.wrapT = THREE.RepeatWrapping;
        concreteTex.repeat.set(2, 2);

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            map: concreteTex,
            roughness: 0.85,
            metalness: 0.15
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 1.1, baseRadius * 1.05, baseHeight, 20), baseMat);
        base.position.y = baseHeight / 2;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        const brickTex = TextureGenerator.createBrick({
            color: '#7a4f2c',
            mortar: '#d2b48c',
            rows: 6,
            cols: 4,
            width: 128,
            height: 128
        });
        brickTex.wrapS = THREE.RepeatWrapping;
        brickTex.wrapT = THREE.RepeatWrapping;
        brickTex.repeat.set(2, 2);

        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x4b3a2a,
            map: brickTex,
            roughness: 0.6,
            metalness: 0.25
        });

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.18, baseRadius * 0.16, poleHeight, 12), poleMat);
        pole.position.y = baseHeight + poleHeight / 2;
        pole.castShadow = true;
        pole.receiveShadow = true;
        group.add(pole);

        // Lantern body
        const lanternGroup = new THREE.Group();
        lanternGroup.position.y = baseHeight + poleHeight;
        group.add(lanternGroup);

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x2f2a28,
            roughness: 0.35,
            metalness: 0.6
        });

        const frame = new THREE.Mesh(new THREE.BoxGeometry(baseRadius * 0.9, lanternHeight, baseRadius * 0.9), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        lanternGroup.add(frame);

        const glassMat = new THREE.MeshStandardMaterial({
            color: GOLDEN_YELLOW,
            emissive: new THREE.Color(GOLDEN_YELLOW),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.05
        });
        const glass = new THREE.Mesh(new THREE.BoxGeometry(baseRadius * 0.78, lanternHeight * 0.72, baseRadius * 0.78), glassMat);
        glass.position.y = 0.02;
        glass.castShadow = false;
        glass.receiveShadow = false;
        lanternGroup.add(glass);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(baseRadius * 0.65, lanternHeight * 0.38, 16), frameMat);
        roof.position.y = lanternHeight / 2 + roof.geometry.parameters.height / 2;
        roof.castShadow = true;
        roof.receiveShadow = true;
        lanternGroup.add(roof);

        const perch = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius * 0.25, baseRadius * 0.25, lanternHeight * 0.15, 12), poleMat);
        perch.position.y = -lanternHeight / 2 - perch.geometry.parameters.height / 2;
        perch.castShadow = true;
        perch.receiveShadow = true;
        lanternGroup.add(perch);

        const perchCap = new THREE.Mesh(new THREE.SphereGeometry(baseRadius * 0.28, 12, 12), frameMat);
        perchCap.position.y = perch.position.y - perch.geometry.parameters.height / 2 - perchCap.geometry.parameters.radius;
        perchCap.castShadow = true;
        perchCap.receiveShadow = true;
        lanternGroup.add(perchCap);

        // Firefly swarm around the lantern
        const fireflyGroup = new THREE.Group();
        fireflyGroup.position.y = lanternGroup.position.y + lanternHeight * 0.15;
        group.add(fireflyGroup);
        this._fireflyGroup = fireflyGroup;

        const fireflyCount = params.fireflyCount || 9;
        const fireflyMaterial = new THREE.MeshStandardMaterial({
            color: GOLDEN_YELLOW,
            emissive: new THREE.Color(MINT_GLOW),
            emissiveIntensity: 1.2,
            roughness: 0.35,
            metalness: 0.05,
            transparent: true,
            opacity: 0.95
        });

        for (let i = 0; i < fireflyCount; i++) {
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), fireflyMaterial);
            orb.castShadow = false;
            orb.receiveShadow = false;
            fireflyGroup.add(orb);
            this._fireflies.push(orb);
            this._fireflyData.push({
                radius: baseRadius * 0.55 + Math.random() * 0.4,
                height: Math.random() * lanternHeight * 0.5,
                speed: 0.5 + Math.random() * 0.8,
                bobSpeed: 1 + Math.random() * 1.5,
                bobAmount: 0.07 + Math.random() * 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Light anchor sits at the lantern core
        this._lightAnchor.set(0, lanternGroup.position.y + lanternHeight * 0.1, 0);

        // Store materials for animated glow
        this._glassMaterial = glassMat;
        this._fireflyMaterial = fireflyMaterial;

        return group;
    }

    postInit() {
        if (this.mesh) {
            this._baseRotation.copy(this.mesh.rotation);
        }

        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightAnchor.clone().applyMatrix4(this.mesh.matrixWorld);
            const baseIntensity = this.params.lightIntensity || 2.4;
            this._lightHandle = lightSystem.register(worldPos, MINT_GLOW, baseIntensity, 12);
            if (this._lightHandle) {
                this._lightHandle.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        if (!this.mesh) return;

        this._time += dt;

        // Gentle sway to simulate wind
        const sway = Math.sin(this._time * 0.6 + (this.params.seed || 0)) * THREE.MathUtils.degToRad(2.2);
        this.mesh.rotation.z = this._baseRotation.z + sway;

        // Animate fireflies
        if (this._fireflyGroup) {
            for (let i = 0; i < this._fireflies.length; i++) {
                const fly = this._fireflies[i];
                const data = this._fireflyData[i];
                const angle = data.phase + this._time * data.speed;
                const bob = Math.sin(this._time * data.bobSpeed + data.phase) * data.bobAmount;
                fly.position.set(
                    Math.cos(angle) * data.radius,
                    data.height + bob,
                    Math.sin(angle) * data.radius
                );
            }
        }

        // Pulse emissive glow
        const glowPulse = 0.85 + Math.sin(this._time * 1.6) * 0.15;
        if (this._glassMaterial) {
            this._glassMaterial.emissiveIntensity = glowPulse * 0.8;
        }
        if (this._fireflyMaterial) {
            this._fireflyMaterial.emissiveIntensity = 1.1 * glowPulse;
        }

        // Sync virtual light intensity
        if (this._lightHandle) {
            const baseIntensity = this.params.lightIntensity || 2.4;
            this._lightHandle.intensity = baseIntensity * glowPulse;
        }
    }
}

EntityRegistry.register('fireflyLantern', FireflyLanternEntity);
