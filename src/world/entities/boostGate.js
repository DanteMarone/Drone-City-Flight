import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class BoostGateEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'boostGate';
        this._time = 0;
        this._ringGroup = null;
        this._virtualLight = null;
        this._glowMaterial = null;
        this._accentMaterial = null;
        this._lightLocalPos = null;
        this._rotationSpeed = params.rotationSpeed ?? (0.4 + Math.random() * 0.4);
        this._hoverPhase = params.hoverPhase ?? Math.random() * Math.PI * 2;
    }

    static get displayName() { return 'Boost Gate'; }

    createMesh(params) {
        const group = new THREE.Group();

        const ringRadius = params.radius ?? 2.6 + Math.random() * 0.6;
        const ringThickness = params.thickness ?? 0.32;
        this.params.radius = ringRadius;
        this.params.thickness = ringThickness;
        this.params.rotationSpeed = this._rotationSpeed;
        this.params.hoverPhase = this._hoverPhase;

        const concreteTex = TextureGenerator.createConcrete();
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x888c92,
            map: concreteTex,
            roughness: 0.9,
            metalness: 0.1
        });

        const pad = new THREE.Mesh(new THREE.BoxGeometry(ringRadius * 1.6, 0.35, ringRadius * 1.2), baseMaterial);
        pad.position.y = 0.175;
        pad.castShadow = true;
        pad.receiveShadow = true;
        group.add(pad);

        const pillarGeo = new THREE.BoxGeometry(0.55, 2.1, 0.9);
        const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.35 });
        const leftPillar = new THREE.Mesh(pillarGeo, pillarMaterial);
        leftPillar.position.set(-ringRadius * 0.75, 1.1, 0);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        group.add(leftPillar);

        const rightPillar = leftPillar.clone();
        rightPillar.position.x = -leftPillar.position.x;
        group.add(rightPillar);

        const consoleGeo = new THREE.BoxGeometry(0.6, 0.85, 0.4);
        const consoleMaterial = new THREE.MeshStandardMaterial({
            map: TextureGenerator.createBuildingFacade({
                color: '#0c131d',
                windowColor: '#53f5ff',
                floors: 3,
                cols: 6,
                width: 256,
                height: 128
            }),
            color: 0xffffff,
            emissive: new THREE.Color(0x2dd9ff),
            emissiveIntensity: 0.6,
            metalness: 0.2,
            roughness: 0.35
        });
        const console = new THREE.Mesh(consoleGeo, consoleMaterial);
        console.position.set(0, 0.55, ringRadius * 0.4);
        console.castShadow = true;
        console.receiveShadow = true;
        group.add(console);

        const ringGroup = new THREE.Group();
        ringGroup.position.y = 2.4;
        ringGroup.rotation.z = THREE.MathUtils.degToRad(params.tilt ?? (Math.random() * 6 - 3));
        this._ringGroup = ringGroup;
        group.add(ringGroup);

        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.85 });
        const frame = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, ringThickness, 18, 64), frameMaterial);
        frame.castShadow = true;
        frame.receiveShadow = true;
        ringGroup.add(frame);

        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x46e0ff,
            emissive: new THREE.Color(0x46e0ff),
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.8,
            metalness: 0.05,
            roughness: 0.15
        });
        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(ringRadius * 0.88, ringThickness * 0.22, 12, 64), glowMaterial);
        glowRing.renderOrder = 2;
        ringGroup.add(glowRing);
        this._glowMaterial = glowMaterial;

        const finsGroup = new THREE.Group();
        ringGroup.add(finsGroup);
        const finMaterial = new THREE.MeshStandardMaterial({
            color: 0x0ea5e9,
            emissive: new THREE.Color(0x0ea5e9),
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
        const finGeo = new THREE.PlaneGeometry(ringThickness * 2.5, ringRadius * 0.4);
        for (let i = 0; i < 6; i++) {
            const fin = new THREE.Mesh(finGeo, finMaterial);
            fin.rotation.y = (Math.PI * 2 / 6) * i;
            finsGroup.add(fin);
        }
        this._accentMaterial = finMaterial;

        const innerSpokes = new THREE.Group();
        ringGroup.add(innerSpokes);
        const spokeGeo = new THREE.BoxGeometry(0.16, ringThickness * 1.2, 0.16);
        const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.6, roughness: 0.35 });
        for (let i = 0; i < 12; i++) {
            const spoke = new THREE.Mesh(spokeGeo, spokeMaterial);
            const angle = i * (Math.PI * 2 / 12);
            spoke.position.set(Math.cos(angle) * ringRadius * 0.6, Math.sin(angle) * ringRadius * 0.6, 0);
            spoke.lookAt(0, 0, 0);
            spoke.rotation.z += Math.PI / 2;
            spoke.castShadow = true;
            innerSpokes.add(spoke);
        }

        this._lightLocalPos = new THREE.Vector3(0, ringGroup.position.y, 0);

        return group;
    }

    postInit() {
        const lightSystem = this.params.lightSystem || window.app?.world?.lightSystem;
        if (lightSystem && this.mesh && this._lightLocalPos) {
            this.mesh.updateMatrixWorld(true);
            const worldPos = this._lightLocalPos.clone().applyMatrix4(this.mesh.matrixWorld);
            this._virtualLight = lightSystem.register(
                worldPos,
                this.params.lightColor || 0x46e0ff,
                this.params.lightIntensity || 3.2,
                24
            );

            if (this._virtualLight) {
                this._virtualLight.parentMesh = this.mesh;
            }
        }
    }

    update(dt) {
        this._time += dt;

        if (this._ringGroup) {
            const bob = Math.sin(this._time * 1.4 + this._hoverPhase) * 0.08;
            this._ringGroup.position.y = 2.4 + bob;
            this._ringGroup.rotation.y += this._rotationSpeed * dt;
        }

        const pulse = 0.5 + 0.5 * Math.sin(this._time * 3.2);
        if (this._glowMaterial) {
            this._glowMaterial.emissiveIntensity = 1.0 + pulse * 1.1;
            this._glowMaterial.opacity = 0.7 + pulse * 0.2;
        }

        if (this._accentMaterial) {
            this._accentMaterial.emissiveIntensity = 0.4 + pulse * 0.5;
            this._accentMaterial.opacity = 0.6 + pulse * 0.25;
        }

        if (this._virtualLight) {
            const baseIntensity = this.params.lightIntensity || 3.2;
            this._virtualLight.intensity = baseIntensity * (0.75 + pulse * 0.6);
        }
    }
}

EntityRegistry.register('boostGate', BoostGateEntity);
